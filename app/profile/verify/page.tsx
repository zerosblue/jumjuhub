"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { Shield, CheckCircle } from "lucide-react";

export default function VerifyPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [step, setStep] = useState<"choose" | "self" | "document" | "done">("choose");
  const [brandName, setBrandName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const verifyLevel = session?.user?.verifyLevel;

  const handleSelfVerify = async () => {
    if (!brandName.trim()) { setError("브랜드명을 입력해주세요."); return; }
    setLoading(true);
    const res = await fetch("/api/user/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "SELF", brandName }),
    });
    if (res.ok) { await update(); setStep("done"); }
    else { const d = await res.json(); setError(d.error ?? "오류 발생"); }
    setLoading(false);
  };

  if (verifyLevel === "VERIFIED") {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-sm mx-auto px-4 py-16 text-center">
          <CheckCircle size={48} className="text-green-600 mx-auto mb-4" />
          <h1 className="text-xl font-black text-gray-900">인증된 점주입니다</h1>
          <p className="text-sm text-gray-500 mt-2">사업자등록증 인증이 완료되었습니다.</p>
          <button onClick={() => router.push("/profile")} className="mt-6 bg-green-800 text-white text-sm font-medium px-6 py-2.5 rounded-xl hover:bg-green-700">
            마이페이지로
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-sm mx-auto px-4 py-8">
        <h1 className="text-xl font-black text-gray-900 mb-2">점주 인증</h1>
        <p className="text-sm text-gray-500 mb-6">인증 후 점주 실제후기를 작성할 수 있어요</p>

        {step === "choose" && (
          <div className="space-y-3">
            {verifyLevel === "SELF" && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                <p className="text-sm font-bold text-blue-800">✋ 점주 자기인증 완료</p>
                <p className="text-xs text-blue-600 mt-1">사업자등록증 인증으로 업그레이드하면 인증점주 배지를 받을 수 있어요.</p>
              </div>
            )}

            <button
              onClick={() => setStep("self")}
              disabled={verifyLevel === ("SELF" as string) || verifyLevel === ("VERIFIED" as string)}
              className="w-full bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-green-400 transition-colors disabled:opacity-40"
            >
              <p className="font-bold text-gray-900">✋ 1단계: 점주 자기인증</p>
              <p className="text-xs text-gray-500 mt-1">브랜드명 입력만으로 즉시 완료 · "점주 자기인증" 배지</p>
            </button>

            <button
              onClick={() => setStep("document")}
              className="w-full bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-green-400 transition-colors"
            >
              <p className="font-bold text-gray-900">✅ 2단계: 사업자등록증 인증</p>
              <p className="text-xs text-gray-500 mt-1">서류 제출 → 관리자 승인 · "인증점주" 배지 (1~2일 소요)</p>
            </button>
          </div>
        )}

        {step === "self" && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="font-bold text-gray-900">점주 자기인증</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">운영 중인 브랜드명</label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="예: BBQ, 메가커피, CU"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-2">
              <button onClick={() => setStep("choose")} className="flex-1 border border-gray-200 text-gray-600 text-sm py-2.5 rounded-xl">취소</button>
              <button onClick={handleSelfVerify} disabled={loading} className="flex-1 bg-green-800 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-green-700 disabled:opacity-50">
                {loading ? "처리 중..." : "자기인증 완료"}
              </button>
            </div>
          </div>
        )}

        {step === "document" && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="font-bold text-gray-900">사업자등록증 인증</h2>
            <p className="text-sm text-gray-600">
              사업자등록증 사진을 아래 이메일로 보내주세요.<br />
              관리자 확인 후 1~2일 내에 인증됩니다.
            </p>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-sm font-bold text-gray-700">admin@jumjuhub.com</p>
              <p className="text-xs text-gray-400 mt-1">제목: 점주 인증 요청 - {session?.user?.nickname}</p>
            </div>
            <button onClick={() => setStep("choose")} className="w-full border border-gray-200 text-gray-600 text-sm py-2.5 rounded-xl">
              돌아가기
            </button>
          </div>
        )}

        {step === "done" && (
          <div className="text-center py-8">
            <CheckCircle size={48} className="text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-black text-gray-900">자기인증 완료!</h2>
            <p className="text-sm text-gray-500 mt-2">"점주 자기인증" 배지가 부여되었습니다.</p>
            <button onClick={() => router.push("/")} className="mt-6 bg-green-800 text-white text-sm font-medium px-6 py-2.5 rounded-xl hover:bg-green-700">
              홈으로
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
