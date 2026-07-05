import Header from "@/components/Header";
import Link from "next/link";

export const metadata = { title: "개인정보처리방침 | 점주허브" };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-black text-gray-900 mb-2">개인정보처리방침</h1>
        <p className="text-xs text-gray-400 mb-8">시행일: 2026년 1월 1일</p>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-8 text-sm text-gray-700 leading-relaxed">

          <section>
            <h2 className="font-bold text-gray-900 mb-2">1. 수집하는 개인정보 항목</h2>
            <p className="mb-2">회사는 소셜 로그인(Google, Kakao) 연동 시 다음 정보를 수집합니다.</p>
            <ul className="space-y-1 list-disc list-inside text-gray-600">
              <li>이메일 주소</li>
              <li>프로필 사진 (소셜 계정 제공 시)</li>
              <li>닉네임 (회원이 직접 설정)</li>
            </ul>
            <p className="mt-2 text-gray-500">서비스 이용 과정에서 게시글, 댓글, 접속 로그 등이 자동 생성·저장될 수 있습니다.</p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">2. 개인정보 수집 목적</h2>
            <ul className="space-y-1 list-disc list-inside text-gray-600">
              <li>회원 식별 및 서비스 제공</li>
              <li>점주 인증 처리</li>
              <li>서비스 개선 및 통계 분석</li>
              <li>불법·부당 이용 방지</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">3. 개인정보 보유 및 이용 기간</h2>
            <p>회원 탈퇴 시까지 보유합니다. 단, 관계 법령에 따라 일정 기간 보존이 필요한 경우 해당 기간 동안 보유합니다.</p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">4. 개인정보의 제3자 제공</h2>
            <p>회사는 회원의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 단, 법령에 의거하거나 수사기관의 요청이 있는 경우 예외로 합니다.</p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">5. 개인정보 처리 위탁</h2>
            <div className="overflow-x-auto">
              <table className="text-xs w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-3 py-2 text-left">수탁업체</th>
                    <th className="border border-gray-200 px-3 py-2 text-left">위탁 내용</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2">Vercel Inc.</td>
                    <td className="border border-gray-200 px-3 py-2">서버 운영 및 파일 저장</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2">Google LLC</td>
                    <td className="border border-gray-200 px-3 py-2">소셜 로그인 인증</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2">Kakao Corp.</td>
                    <td className="border border-gray-200 px-3 py-2">소셜 로그인 인증</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">6. 이용자의 권리</h2>
            <p>회원은 언제든지 자신의 개인정보를 조회·수정하거나 탈퇴를 요청할 수 있습니다. 문의는 아래 연락처로 해주세요.</p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">7. 쿠키(Cookie) 사용</h2>
            <p>서비스는 로그인 세션 유지를 위해 쿠키를 사용합니다. 브라우저 설정에서 쿠키를 거부할 수 있으나, 이 경우 서비스 일부 기능 이용이 제한될 수 있습니다.</p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">8. 개인정보 보호책임자</h2>
            <div className="bg-gray-50 rounded-xl p-4 text-gray-600">
              <p>이메일: <a href="mailto:zerosblue7717@gmail.com" className="text-green-700 underline">zerosblue7717@gmail.com</a></p>
            </div>
          </section>

        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">← 홈으로</Link>
        </div>
      </main>
    </div>
  );
}
