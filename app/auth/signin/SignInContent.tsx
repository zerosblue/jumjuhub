"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-green-800 mb-1">점주허브</h1>
          <p className="text-sm text-gray-500">4,600개 브랜드, 진짜 점주들의 솔직한 이야기</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => signIn("google", { callbackUrl })}
            className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z" />
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z" />
              <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z" />
              <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z" />
            </svg>
            Google로 시작하기
          </button>

          <button
            onClick={() => signIn("kakao", { callbackUrl })}
            className="w-full flex items-center justify-center gap-3 bg-[#FEE500] rounded-xl py-3 text-sm font-medium text-[#000000cc] hover:bg-[#FDD800] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M9 1.5C4.858 1.5 1.5 4.084 1.5 7.27c0 2.04 1.285 3.828 3.223 4.87l-.82 3.063c-.072.27.225.485.46.325l3.595-2.38c.34.047.686.072 1.042.072 4.142 0 7.5-2.584 7.5-5.77S13.142 1.5 9 1.5z"
                fill="#000000"
              />
            </svg>
            카카오로 시작하기
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          로그인 시{" "}
          <a href="/terms" className="underline">이용약관</a> 및{" "}
          <a href="/privacy" className="underline">개인정보처리방침</a>에 동의합니다.
        </p>
      </div>
    </div>
  );
}
