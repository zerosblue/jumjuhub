"use client";

import { useState } from "react";

export default function SyncButton({ initialCount }: { initialCount: number }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [brandCount, setBrandCount] = useState(initialCount);

  const runSync = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/franchise-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
        signal: AbortSignal.timeout(290000),
      });
      const data = await res.json();
      if (res.ok) {
        setBrandCount(data.created + data.updated);
        setResult({ ok: true, message: `${data.yr}년 기준: 신규 ${data.created.toLocaleString()}개, 업데이트 ${data.updated.toLocaleString()}개` });
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
      <p className="text-sm text-gray-600">현재 브랜드 수: <strong>{brandCount.toLocaleString()}개</strong></p>
      <button
        onClick={runSync}
        disabled={loading}
        className="bg-green-800 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "동기화 중..." : "공정위 데이터 동기화"}
      </button>
      {result && (
        <p className={`text-sm font-medium ${result.ok ? "text-green-700" : "text-red-600"}`}>
          {result.ok ? "✅" : "❌"} {result.message}
        </p>
      )}
    </div>
  );
}
