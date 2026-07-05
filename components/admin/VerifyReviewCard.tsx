"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Trash2, ImageOff } from "lucide-react";

interface VerifyReviewCardProps {
  verification: {
    id: string;
    type: string;
    brandName: string | null;
    documentUrl: string | null;
    status: string;
    note: string | null;
    createdAt: string;
    user: { nickname: string | null; email: string | null };
  };
}

export default function VerifyReviewCard({ verification: v }: VerifyReviewCardProps) {
  const router = useRouter();
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);

  const act = async (action: "APPROVE" | "REJECT" | "DELETE_IMAGE") => {
    if (action === "DELETE_IMAGE" && !confirm("사업자등록증 이미지를 영구 삭제하시겠어요?")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationId: v.id,
          action,
          rejectReason: action === "REJECT" ? rejectReason : undefined,
        }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const d = await res.json().catch(() => ({}));
        alert(d.error ?? "처리에 실패했습니다.");
      }
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    }
    setLoading(false);
    setRejecting(false);
  };

  const isPending = v.status === "PENDING";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-bold text-gray-900 text-sm">{v.user.nickname ?? v.user.email ?? "알 수 없음"}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            브랜드: <span className="font-medium text-gray-700">{v.brandName ?? "-"}</span>
            {" · "}신청일: {new Date(v.createdAt).toLocaleDateString("ko-KR")}
          </p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
          v.status === "PENDING" ? "bg-amber-50 text-amber-700 border border-amber-200"
          : v.status === "APPROVED" ? "bg-green-50 text-green-700 border border-green-200"
          : "bg-red-50 text-red-600 border border-red-200"
        }`}>
          {v.status === "PENDING" ? "대기" : v.status === "APPROVED" ? "승인됨" : "거부됨"}
        </span>
      </div>

      {/* 사업자등록증 이미지 */}
      {v.documentUrl ? (
        <div className="mb-3">
          {imageOpen ? (
            <div>
              <img src={v.documentUrl} alt="사업자등록증" className="w-full rounded-xl border border-gray-200" />
              <button onClick={() => setImageOpen(false)} className="text-xs text-gray-500 mt-1 hover:underline">접기</button>
            </div>
          ) : (
            <button
              onClick={() => setImageOpen(true)}
              className="w-full border border-dashed border-gray-300 rounded-xl py-3 text-sm text-gray-600 hover:border-green-400 hover:text-green-700 transition-colors"
            >
              📄 사업자등록증 이미지 보기
            </button>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-400 mb-3 flex items-center gap-1"><ImageOff size={12} /> 이미지 없음 (삭제됨)</p>
      )}

      {v.status === "REJECTED" && v.note && (
        <p className="text-xs text-red-500 mb-3">거부 사유: {v.note}</p>
      )}

      {/* 액션 */}
      {isPending && !rejecting && (
        <div className="flex gap-2">
          <button
            onClick={() => act("APPROVE")}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 bg-green-700 text-white text-sm font-medium py-2 rounded-xl hover:bg-green-800 disabled:opacity-50"
          >
            <CheckCircle size={14} /> 승인
          </button>
          <button
            onClick={() => setRejecting(true)}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-red-200 text-red-600 text-sm font-medium py-2 rounded-xl hover:bg-red-50 disabled:opacity-50"
          >
            <XCircle size={14} /> 거부
          </button>
        </div>
      )}

      {isPending && rejecting && (
        <div className="space-y-2">
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="거부 사유를 입력하세요 (신청자에게 알림으로 전달됩니다)"
            rows={2}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
          />
          <div className="flex gap-2">
            <button onClick={() => setRejecting(false)} className="flex-1 border border-gray-200 text-gray-600 text-sm py-2 rounded-xl">
              취소
            </button>
            <button
              onClick={() => act("REJECT")}
              disabled={loading || !rejectReason.trim()}
              className="flex-1 bg-red-600 text-white text-sm font-medium py-2 rounded-xl hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? "처리 중..." : "거부 확정"}
            </button>
          </div>
        </div>
      )}

      {/* 승인 완료 후 이미지 삭제 옵션 */}
      {v.status === "APPROVED" && v.documentUrl && (
        <button
          onClick={() => act("DELETE_IMAGE")}
          disabled={loading}
          className="w-full flex items-center justify-center gap-1.5 border border-gray-200 text-gray-500 text-xs py-2 rounded-xl hover:bg-gray-50 disabled:opacity-50"
        >
          <Trash2 size={12} /> 사업자등록증 이미지 삭제 (개인정보 보호)
        </button>
      )}
    </div>
  );
}
