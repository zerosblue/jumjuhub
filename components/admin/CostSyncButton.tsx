"use client";

import { useState } from "react";

export default function CostSyncButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const runSync = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/franchise-cost-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
        signal: AbortSignal.timeout(290000),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({
          ok: true,
          message: `${data.yr}년 기준: 부담금 ${data.apiRecords.toLocaleString()}건, 인테리어 ${data.interiorRecords.toLocaleString()}건 수신 → 브랜드 ${data.updated.toLocaleString()}개 업데이트`,
        });
      } else {
        setResult({ ok: false, message: data.error ?? "동기화 실패" });
      }
    } catch (e: any) {
      setResult({ ok: false, message: e?.name === "TimeoutError" ? "시간 초과 — 다시 시도해주세요." : "네트워크 오류" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        공정위 부담금·인테리어 API로 브랜드별 창업비용(가맹비/보증금/교육비/인테리어)을 채웁니다.
      </p>
      <button
        onClick={runSync}
        disabled={loading}
        className="bg-amber-700 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-colors"
      >
        {loading ? "동기화 중..." : "창업비용 동기화"}
      </button>
      {result && (
        <p className={`text-sm font-medium ${result.ok ? "text-green-700" : "text-red-600"}`}>
          {result.ok ? "✅" : "❌"} {result.message}
        </p>
      )}
    </div>
  );
}
