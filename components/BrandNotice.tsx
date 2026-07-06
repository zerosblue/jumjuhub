"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Megaphone, ShieldCheck } from "lucide-react";

export default function BrandNotice({ brandName }: { brandName: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-100 bg-green-50/60">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-5 py-3 text-left"
      >
        <Megaphone size={15} className="text-green-700 shrink-0" />
        <span className="text-xs font-bold text-green-800 bg-green-100 px-1.5 py-0.5 rounded shrink-0">공지</span>
        <span className="text-sm font-medium text-gray-800 truncate flex-1">
          {brandName} 게시판 이용 안내
        </span>
        <span className="text-xs text-gray-400 shrink-0 hidden sm:inline">점주허브 운영팀</span>
        <ChevronDown
          size={16}
          className={`text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="px-5 pb-5 text-sm text-gray-700 leading-relaxed space-y-4">
          <p>
            안녕하세요, <strong>점주허브 운영팀</strong>입니다.
            <br />
            이곳은 <strong>{brandName}</strong> 점주님과 예비창업자가 솔직한 정보를 나누는 공간입니다.
          </p>

          <div>
            <p className="font-bold text-gray-900 mb-1">✅ 점주 인증 안내</p>
            <p>
              점주 인증을 완료하면 💰 매출 공유 · ⚖️ 법적 분쟁 · 🚪 폐점/양도 게시판을 이용할 수
              있습니다.
            </p>
            <Link
              href="/profile/verify"
              className="inline-flex items-center gap-1 mt-1.5 text-xs font-bold text-green-700 bg-green-100 hover:bg-green-200 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <ShieldCheck size={13} /> 점주 인증하러 가기 →
            </Link>
          </div>

          <div>
            <p className="font-bold text-gray-900 mb-1">⚠️ 게시글 작성 유의사항</p>
            <p>
              확인되지 않은 사실, 과장·비방성 내용은 명예훼손 등 법적 책임이 발생할 수 있습니다.
              사실에 근거해 작성해주세요. 신고가 누적된 게시글은 블라인드 처리됩니다.
            </p>
          </div>

          <div>
            <p className="font-bold text-gray-900 mb-1">📊 데이터 출처</p>
            <p>
              매장 수·평균 매출·창업비용은 공정거래위원회 가맹사업 정보공개서 기준으로, 최신 실제
              수치와 차이가 있을 수 있습니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
