#!/usr/bin/env python3
"""
공정거래위원회 가맹정보 API 동기화 스크립트
data.go.kr API → PostgreSQL (점주허브 DB)

Usage:
    python scripts/sync-franchise-data.py

Environment variables (or .env file):
    DATABASE_URL=postgresql://user:pass@host:5432/jumjuhub
    PUBLIC_DATA_API_KEY=your-api-key
"""

import os
import re
import sys
import json
import time
import asyncio
import logging
from datetime import datetime
from typing import Optional
from urllib.parse import urlencode, quote

import requests
import psycopg2
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

API_KEY = os.environ["PUBLIC_DATA_API_KEY"]
DATABASE_URL = os.environ["DATABASE_URL"]
BASE_URL = "https://apis.data.go.kr/1130000/FftcBrandRlList"


def to_slug(name: str) -> str:
    """한글 브랜드명 → URL slug 변환"""
    slug = name.lower().strip()
    replacements = {
        "치킨": "chicken", "커피": "coffee", "피자": "pizza", "버거": "burger",
        "분식": "bunsik", "편의점": "convenience", "한식": "hansik", "중식": "chinese",
        "일식": "japanese", "이탈리안": "italian", "베이커리": "bakery", "아이스크림": "icecream",
        "샌드위치": "sandwich", "고기": "gogi", "마라": "mara", "탕": "tang",
        "족발": "jokbal", "삼겹살": "samgyeopsal", "갈비": "galbi", "냉면": "naengmyeon",
    }
    for kr, en in replacements.items():
        slug = slug.replace(kr, en)
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"\s+", "-", slug)
    slug = re.sub(r"-+", "-", slug)
    return slug.strip("-") or "brand-" + str(hash(name) % 100000)


def fetch_brand_list(page_no: int = 1, num_of_rows: int = 1000) -> dict:
    params = {
        "serviceKey": API_KEY,
        "pageNo": page_no,
        "numOfRows": num_of_rows,
        "resultType": "json",
    }
    url = f"{BASE_URL}/getFftcBrandList?" + urlencode(params, safe="=")
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()
    return resp.json()


def fetch_brand_info(page_no: int = 1, num_of_rows: int = 1000) -> dict:
    """가맹점 현황 정보 (매출액, 가맹점수 등)"""
    params = {
        "serviceKey": API_KEY,
        "pageNo": page_no,
        "numOfRows": num_of_rows,
        "resultType": "json",
    }
    url = f"{BASE_URL}/getFftcBrandJngmbsnInfo?" + urlencode(params, safe="=")
    try:
        resp = requests.get(url, timeout=30)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        log.warning(f"가맹점 현황 API 오류: {e}")
        return {}


def parse_amount(value) -> Optional[int]:
    """금액 문자열 → 원 단위 정수 변환 (만원 단위 API 응답)"""
    if value is None or value == "" or value == "0":
        return None
    try:
        return int(float(str(value).replace(",", "")) * 10000)
    except Exception:
        return None


def parse_int(value) -> Optional[int]:
    if value is None or value == "":
        return None
    try:
        return int(str(value).replace(",", ""))
    except Exception:
        return None


def sync(conn):
    cur = conn.cursor()
    created = updated = skipped = 0

    log.info("브랜드 목록 조회 시작...")
    data = fetch_brand_list()
    items = data.get("response", {}).get("body", {}).get("items", {})
    if isinstance(items, dict):
        items = items.get("item", [])
    if not items:
        log.warning("데이터 없음. API 키 및 서비스 확인 필요")
        return

    if not isinstance(items, list):
        items = [items]

    log.info(f"총 {len(items)}개 브랜드 처리 시작")

    for item in items:
        name = (item.get("cmpnm_nm") or item.get("brand_nm") or "").strip()
        if not name:
            skipped += 1
            continue

        slug = to_slug(name)
        category = (item.get("induty_nm") or "기타").strip()
        franchise_fee = parse_amount(item.get("fran_fee") or item.get("FRAN_FEE"))
        deposit = parse_amount(item.get("security_deposit") or item.get("DEPOSIT"))
        store_count = parse_int(item.get("fran_qty") or item.get("FRAN_QTY"))
        direct_count = parse_int(item.get("direct_qty") or item.get("DIRECT_QTY"))
        avg_revenue = parse_amount(item.get("avg_sales_amt") or item.get("AVG_SALES_AMT"))
        interior_cost = parse_amount(item.get("intr_fee") or item.get("INTR_FEE"))
        education_fee = parse_amount(item.get("edu_fee") or item.get("EDU_FEE"))

        now = datetime.now()

        cur.execute('SELECT id FROM "Brand" WHERE slug = %s', (slug,))
        existing = cur.fetchone()

        if existing:
            cur.execute(
                """UPDATE "Brand" SET
                    name = %s, category = %s, "storeCount" = %s, "directStoreCount" = %s,
                    "avgRevenue" = %s, "franchiseFee" = %s, deposit = %s,
                    "interiorCost" = %s, "educationFee" = %s,
                    "dataUpdatedAt" = %s, "updatedAt" = %s
                WHERE slug = %s""",
                (name, category, store_count, direct_count,
                 avg_revenue, franchise_fee, deposit,
                 interior_cost, education_fee,
                 now, now, slug),
            )
            updated += 1
        else:
            import uuid
            brand_id = str(uuid.uuid4())[:25]
            cur.execute(
                """INSERT INTO "Brand"
                    (id, slug, name, category, "storeCount", "directStoreCount",
                     "avgRevenue", "franchiseFee", deposit, "interiorCost", "educationFee",
                     "dataUpdatedAt", "createdAt", "updatedAt")
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                (brand_id, slug, name, category, store_count, direct_count,
                 avg_revenue, franchise_fee, deposit, interior_cost, education_fee,
                 now, now, now),
            )
            created += 1

        if (created + updated + skipped) % 100 == 0:
            conn.commit()
            log.info(f"진행: 생성 {created} / 업데이트 {updated} / 스킵 {skipped}")

    conn.commit()
    cur.close()
    log.info(f"완료! 생성: {created}, 업데이트: {updated}, 스킵: {skipped}")


def main():
    log.info("점주허브 공정위 데이터 동기화 시작")
    conn = psycopg2.connect(DATABASE_URL)
    try:
        sync(conn)
    except Exception as e:
        log.error(f"동기화 실패: {e}")
        conn.rollback()
        sys.exit(1)
    finally:
        conn.close()
    log.info("동기화 완료")


if __name__ == "__main__":
    main()
