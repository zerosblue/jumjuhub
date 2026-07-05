"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function PostError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-4xl mb-4">😓</p>
        <h2 className="text-lg font-bold text-gray-900 mb-2">게시글을 불러오지 못했어요</h2>
        <p className="text-sm text-gray-500 mb-6">잠시 후 다시 시도해 주세요.</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-green-800 text-white text-sm font-medium rounded-xl hover:bg-green-700"
          >
            다시 시도
          </button>
          <Link
            href="/community"
            className="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50"
          >
            목록으로
          </Link>
        </div>
      </div>
    </div>
  );
}
