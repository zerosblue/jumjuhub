"use client";

import { useState } from "react";

export default function BrandToolsButton() {
  const [mergeResult, setMergeResult] = useState<string | null>(null);
  const [logoResult, setLogoResult] = useState<string | null>(null);
  const [loading, setLoading] = useState<"merge" | "logo" | null>(null);

  const runMerge = async (dryRun: boolean) => {
    setLoading("merge");
    setMergeResult(null);
    try {
      const res = await fetch("/api/admin/brand-merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun }),
      });
      const data = await res.json();
      if (res.ok) {
        const merged = data.results.filter((r: any) => r.status === "merged" || r.status === "dry_run");
        setMergeResult(
          dryRun
            ? `[미리보기] 병합 가능: ${merged.length}건 (예: ${merged.slice(0, 3).map((r: any) => `${r.from} → ${r.to}`).join(", ")})`
            : `병합 완료: ${merged.length}건`
        );
      } else {
        setMergeResult("오류: " + data.error);
      }
    } catch {
      setMergeResult("네트워크 오류");
    }
    setLoading(null);
  };

  const runLogoFetch = async () => {
    setLoading("logo");
    setLogoResult(null);
    try {
      const res = await fetch("/api/admin/brand-logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 300 }),
        signal: AbortSignal.timeout(120000),
      });
      const data = await res.json();
      if (res.ok) {
        setLogoResult(`로고 업데이트: ${data.updated}개 / 스킵: ${data.skipped}개`);
      } else {
        setLogoResult("오류: " + data.error);
      }
    } catch {
      setLogoResult("네트워크 오류 또는 시간 초과");
    }
    setLoading(null);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">브랜드명 중복 정리</p>
        <p className="text-xs text-gray-500">씨유(CU)→CU 등 연도별 명칭 변경으로 생긴 중복 레코드 병합</p>
        <div className="flex gap-2">
          <button
            onClick={() => runMerge(true)}
            disabled={loading !== null}
            className="text-xs border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {loading === "merge" ? "처리 중..." : "미리보기"}
          </button>
          <button
            onClick={() => runMerge(false)}
            disabled={loading !== null}
            className="text-xs bg-orange-600 text-white px-3 py-1.5 rounded-lg hover:bg-orange-500 disabled:opacity-50"
          >
            {loading === "merge" ? "처리 중..." : "실제 병합 실행"}
          </button>
        </div>
        {mergeResult && (
          <p className="text-xs text-gray-600 bg-gray-50 rounded p-2">{mergeResult}</p>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">로고 자동 수집 (Clearbit)</p>
        <p className="text-xs text-gray-500">영문명 브랜드 대상으로 Clearbit에서 로고 자동 저장 (300개씩)</p>
        <button
          onClick={runLogoFetch}
          disabled={loading !== null}
          className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-500 disabled:opacity-50"
        >
          {loading === "logo" ? "수집 중..." : "로고 자동 수집"}
        </button>
        {logoResult && (
          <p className="text-xs text-gray-600 bg-gray-50 rounded p-2">{logoResult}</p>
        )}
      </div>
    </div>
  );
}
