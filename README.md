# 점주허브 (JumjuHub)

> 4,600개 브랜드, 진짜 점주들의 솔직한 이야기

프랜차이즈 가맹점주와 예비창업자를 위한 커뮤니티 플랫폼.

---

## 기술 스택

- **Frontend/Backend**: Next.js 15 (App Router)
- **DB**: PostgreSQL (Railway) + Prisma 7
- **Auth**: NextAuth.js v5 (Google + 카카오)
- **이미지**: Cloudinary
- **이메일**: Resend
- **배포**: Vercel + Railway

---

## 로컬 개발 환경 설정

```bash
npm install
cp .env.example .env   # 환경변수 입력
npx prisma migrate dev --name init
npm run dev
```

---

## 환경 변수 설정

### Google OAuth
1. [Google Cloud Console](https://console.cloud.google.com) → OAuth 클라이언트 ID 생성
2. 리디렉션 URI: `http://localhost:3000/api/auth/callback/google`
3. `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` → `.env`

### 카카오 OAuth
1. [Kakao Developers](https://developers.kakao.com) → 애플리케이션 생성
2. 리디렉션 URI: `http://localhost:3000/api/auth/callback/kakao`
3. `KAKAO_CLIENT_ID`(REST API 키), `KAKAO_CLIENT_SECRET` → `.env`

### 공정거래위원회 API
1. [공공데이터포털](https://www.data.go.kr) → "공정거래위원회 가맹사업정보" 신청
2. 인증키 → `PUBLIC_DATA_API_KEY`
3. 상권 분석 기능은 "소상공인시장진흥공단 상가(상권)정보" API도 활용신청 필요 (같은 키 사용)

### 카카오맵 (상권 분석 지도)
1. [Kakao Developers](https://developers.kakao.com) → 내 애플리케이션 → 앱 추가
2. 앱 설정 → 플랫폼 → Web에 `http://localhost:3000`, `https://jumjuhub.com` 등록
3. 제품 설정 → 카카오맵 → 활성화 ON
4. 앱 키 중 **JavaScript 키** → `NEXT_PUBLIC_KAKAO_MAP_API_KEY`

### Cloudinary
1. [cloudinary.com](https://cloudinary.com) 무료 계정 생성
2. Cloud Name, API Key, Secret → `.env`

### Resend (이메일)
1. [resend.com](https://resend.com) → API Key 생성
2. `RESEND_API_KEY` → `.env`

---

## 공정위 데이터 초기 로딩

```bash
pip install -r scripts/requirements.txt
python scripts/sync-franchise-data.py
```

월 1회 자동 실행 (macOS):
```bash
# launchd 스케줄러 등록 (README 전체 버전 참고)
launchctl load ~/Library/LaunchAgents/com.jumjuhub.sync.plist
```

---

## Railway DB + Vercel 배포

```bash
# 1. Railway에서 PostgreSQL 생성 → DATABASE_URL 복사
# 2. 마이그레이션
DATABASE_URL="railway-url" npx prisma migrate deploy

# 3. Vercel 배포
vercel --prod
```

Vercel 환경변수에 `.env` 내용 전체 입력 필요.

---

## 도메인 연결 (jumjuhub.com → Vercel)

1. Vercel → Settings → Domains → `jumjuhub.com` 추가
2. DNS: A 레코드 `@` → `76.76.21.21`, CNAME `www` → `cname.vercel-dns.com`

---

## 관리자 계정 설정

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your@email.com';
```

---

## 프로젝트 구조

```
jumjuhub/
├── app/
│   ├── page.tsx                홈
│   ├── brand/[slug]/           브랜드 상세 + 커뮤니티
│   ├── community/              전체 커뮤니티
│   ├── auth/signin/            로그인
│   ├── admin/                  관리자
│   └── api/                    API Routes
├── components/                 공통 컴포넌트
├── lib/                        prisma, auth, utils
├── prisma/schema.prisma        DB 스키마
├── scripts/sync-franchise-data.py  공정위 API 동기화
└── public/manifest.json        PWA 설정
```
