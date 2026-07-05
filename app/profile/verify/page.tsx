"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { Search, CheckCircle, Shield, Upload, X, ChevronRight } from "lucide-react";
import { upload } from "@vercel/blob/client";

interface BrandOption { id: string; name: string; category: string; }

function BrandSearch({ onChange }: { onChange: (name: string) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BrandOption[]>([]);
  const [selected, setSelected] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const search = async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    try {
      const res = await fetch(`/api/brands?q=${encodeURIComponent(q)}&limit=8`);
      const data = await res.json();
      setResults(data.brands ?? []);
    } catch { setResults([]); }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v); setSelected(""); onChange(""); setOpen(true); search(v);
  };

  const select = (b: BrandOption) => {
    setQuery(b.name); setSelected(b.name); onChange(b.name); setOpen(false); setResults([]);
  };

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text" value={query} onChange={handleInput}
          onFocus={() => { if (query && !selected) setOpen(true); }}
          placeholder="운영 중인 브랜드명 검색"
          className={`w-full border rounded-xl pl-8 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 ${selected ? "border-green-400 bg-green-50" : "border-gray-200"}`}
        />
        {query && (
          <button type="button" onClick={() => { setQuery(""); setSelected(""); onChange(""); setResults([]); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>
      {selected && <p className="text-xs text-green-700 mt-1">✓ {selected} 선택됨</p>}
      {open && results.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {results.map((b) => (
            <li key={b.id}>
              <button type="button" onClick={() => select(b)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-green-50 flex items-center justify-between gap-2">
                <span className="font-medium text-gray-900 truncate">{b.name}</span>
                <span className="text-xs text-gray-400 shrink-0">{b.category}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const SELF_BENEFITS = [
  "점주 실제후기 (REVIEW) 작성",
  "법적 분쟁 정보 (LEGAL) 작성",
  "폐점/양도 정보 (CLOSURE) 작성",
  '"점주 자기인증" 배지',
];
const VERIFIED_BENEFITS = [
  "본사 갑질 제보 (REPORT_ABUSE) 작성",
  "매출 공유 (REVENUE) 작성",
  '"인증점주 ✅" 배지로 신뢰도 상승',
  "예비창업자 질문 우선 노출",
];

export default function VerifyPage() {
  const { data: session, update } = useSession();
  const router = useRouter();

  const verifyLevel = session?.user?.verifyLevel as "NONE" | "SELF" | "VERIFIED" | undefined;

  // Self-verify state
  const [brandName, setBrandName] = useState("");
  const [selfChecked, setSelfChecked] = useState(false);
  const [selfLoading, setSelfLoading] = useState(false);
  const [selfDone, setSelfDone] = useState(false);
  const [selfError, setSelfError] = useState("");

  // Document-verify state
  const [docBrandName, setDocBrandName] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const [docLoading, setDocLoading] = useState(false);
  const [docDone, setDocDone] = useState(false);
  const [docError, setDocError] = useState("");

  const handleSelfVerify = async () => {
    if (!brandName.trim()) { setSelfError("브랜드를 선택해주세요."); return; }
    if (!selfChecked) { setSelfError("점주 확인 체크박스를 체크해주세요."); return; }
    setSelfLoading(true); setSelfError("");
    try {
      const res = await fetch("/api/user/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "SELF", brandName }),
      });
      if (res.ok) { await update(); setSelfDone(true); }
      else { const d = await res.json(); setSelfError(d.error ?? "오류가 발생했습니다."); }
    } catch { setSelfError("네트워크 오류가 발생했습니다."); }
    setSelfLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { setDocError("파일 크기는 20MB 이하여야 합니다."); return; }
    setDocFile(file);
    setDocPreview(URL.createObjectURL(file));
    setDocError("");
  };

  const handleDocVerify = async () => {
    if (!docBrandName.trim()) { setDocError("브랜드를 선택해주세요."); return; }
    if (!docFile) { setDocError("사업자등록증 이미지를 업로드해주세요."); return; }
    setDocLoading(true); setDocError("");
    try {
      const blob = await upload(
        `verify/${Date.now()}-${docFile.name}`,
        docFile,
        { access: "public", handleUploadUrl: "/api/upload" }
      );
      const res = await fetch("/api/user/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "DOCUMENT", brandName: docBrandName, documentUrl: blob.url }),
      });
      if (res.ok) { setDocDone(true); }
      else { const d = await res.json(); setDocError(d.error ?? "오류가 발생했습니다."); }
    } catch (err) {
      setDocError((err as Error).message || "업로드 중 오류가 발생했습니다.");
    }
    setDocLoading(false);
  };

  if (!session) {
    router.push("/auth/signin");
    return null;
  }

  if (verifyLevel === "VERIFIED") {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-lg mx-auto px-4 py-16 text-center">
          <CheckCircle size={52} className="text-green-600 mx-auto mb-4" />
          <h1 className="text-xl font-black text-gray-900">공식 인증점주</h1>
          <p className="text-sm text-gray-500 mt-2">사업자등록증 인증이 완료되었습니다. 모든 게시판 이용 가능합니다.</p>
          <button onClick={() => router.push("/profile")}
            className="mt-6 bg-green-800 text-white text-sm font-medium px-6 py-2.5 rounded-xl hover:bg-green-700">
            마이페이지로
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-xl font-black text-gray-900">점주 인증</h1>
          <p className="text-sm text-gray-500 mt-1">인증 단계별로 추가 게시판 이용 권한이 부여됩니다.</p>
        </div>

        {/* ── 1단계: 자기신고 인증 ── */}
        <section className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className={`px-5 py-4 border-b border-gray-100 flex items-center justify-between ${verifyLevel === "SELF" || selfDone ? "bg-blue-50" : ""}`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${verifyLevel === "SELF" || selfDone ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                {verifyLevel === "SELF" || selfDone ? "✓" : "1"}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">점주 자기인증</p>
                <p className="text-xs text-gray-500">브랜드 선택 + 확인 체크 → 즉시 완료</p>
              </div>
            </div>
            {(verifyLevel === "SELF" || selfDone) && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">완료</span>
            )}
          </div>

          {/* 베네핏 */}
          <div className="px-5 py-4 border-b border-gray-50 bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 mb-2">자기인증 후 이용 가능</p>
            <div className="space-y-1">
              {SELF_BENEFITS.map((b) => (
                <p key={b} className="text-xs text-gray-700 flex items-center gap-1.5">
                  <CheckCircle size={11} className="text-green-500 shrink-0" /> {b}
                </p>
              ))}
            </div>
          </div>

          {/* 폼 */}
          {selfDone ? (
            <div className="px-5 py-6 text-center">
              <CheckCircle size={36} className="text-blue-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-900">자기인증 완료!</p>
              <p className="text-xs text-gray-500 mt-1">점주 자기인증 배지가 부여되었습니다.</p>
            </div>
          ) : verifyLevel === "SELF" ? (
            <div className="px-5 py-4 text-center text-sm text-gray-500">
              이미 자기인증이 완료되었습니다. 2단계로 업그레이드하세요.
            </div>
          ) : (
            <div className="px-5 py-4 space-y-3">
              <BrandSearch onChange={setBrandName} />
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={selfChecked} onChange={(e) => setSelfChecked(e.target.checked)}
                  className="mt-0.5 rounded" />
                <span className="text-sm text-gray-700">저는 위 브랜드의 실제 가맹점주입니다.</span>
              </label>
              {selfError && <p className="text-xs text-red-500">{selfError}</p>}
              <button onClick={handleSelfVerify} disabled={selfLoading}
                className="w-full bg-blue-600 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50">
                {selfLoading ? "처리 중..." : "자기인증 완료하기"}
              </button>
            </div>
          )}
        </section>

        {/* ── 2단계: 공식 인증 ── */}
        <section className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-sm font-black">2</div>
              <div>
                <p className="font-bold text-gray-900 text-sm">사업자등록증 인증</p>
                <p className="text-xs text-gray-500">서류 제출 → 관리자 승인 (1~2일)</p>
              </div>
            </div>
            <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">업그레이드</span>
          </div>

          {/* 베네핏 */}
          <div className="px-5 py-4 border-b border-gray-50 bg-amber-50/50">
            <p className="text-xs font-semibold text-gray-500 mb-2">공식 인증 후 추가 이용 가능</p>
            <div className="space-y-1">
              {VERIFIED_BENEFITS.map((b) => (
                <p key={b} className="text-xs text-gray-700 flex items-center gap-1.5">
                  <Shield size={11} className="text-amber-500 shrink-0" /> {b}
                </p>
              ))}
            </div>
          </div>

          {/* 폼 */}
          {docDone ? (
            <div className="px-5 py-6 text-center">
              <CheckCircle size={36} className="text-amber-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-900">제출 완료!</p>
              <p className="text-xs text-gray-500 mt-1">관리자 검토 후 1~2일 내 결과를 알림으로 안내합니다.</p>
            </div>
          ) : (
            <div className="px-5 py-4 space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1.5">운영 브랜드</p>
                <BrandSearch onChange={setDocBrandName} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1.5">사업자등록증 이미지</p>
                {docPreview ? (
                  <div className="relative">
                    <img src={docPreview} alt="사업자등록증" className="w-full rounded-xl object-cover max-h-48 border border-gray-200" />
                    <button type="button" onClick={() => { setDocFile(null); setDocPreview(null); }}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center">
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center cursor-pointer hover:border-green-400 transition-colors">
                    <Upload size={24} className="text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">이미지 선택 (최대 20MB)</span>
                    <span className="text-xs text-gray-400 mt-0.5">개인정보 부분 가려도 됩니다</span>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                )}
              </div>
              <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-800">
                업로드된 사업자등록증은 관리자만 열람할 수 있으며, 인증 완료 후 삭제 요청 가능합니다.
              </div>
              {docError && <p className="text-xs text-red-500">{docError}</p>}
              <button onClick={handleDocVerify} disabled={docLoading}
                className="w-full bg-amber-500 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-amber-600 disabled:opacity-50">
                {docLoading ? "업로드 중..." : "인증 신청하기"}
              </button>
            </div>
          )}
        </section>

        <button onClick={() => router.push("/profile")} className="w-full text-sm text-gray-500 py-2">
          마이페이지로 돌아가기
        </button>
      </main>
    </div>
  );
}
