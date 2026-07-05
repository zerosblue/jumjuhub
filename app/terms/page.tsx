import Header from "@/components/Header";
import Link from "next/link";

export const metadata = { title: "이용약관 | 점주허브" };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-black text-gray-900 mb-2">이용약관</h1>
        <p className="text-xs text-gray-400 mb-8">시행일: 2026년 1월 1일</p>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-8 text-sm text-gray-700 leading-relaxed">

          <section>
            <h2 className="font-bold text-gray-900 mb-2">제1조 (목적)</h2>
            <p>본 약관은 점주허브(이하 "회사")가 운영하는 웹사이트 jumjuhub.com(이하 "서비스")의 이용 조건 및 절차, 회사와 이용자의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.</p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">제2조 (정의)</h2>
            <ul className="space-y-1 list-disc list-inside text-gray-600">
              <li>"서비스"란 회사가 제공하는 프랜차이즈 정보 조회 및 점주 커뮤니티 서비스 일체를 말합니다.</li>
              <li>"회원"이란 본 약관에 동의하고 회원 가입을 완료한 자를 말합니다.</li>
              <li>"게시물"이란 회원이 서비스에 게재한 글, 사진, 댓글 등 모든 정보를 말합니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">제3조 (약관의 효력 및 변경)</h2>
            <p>회사는 필요 시 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지를 통해 효력이 발생합니다. 변경 후 계속 서비스를 이용하면 변경 약관에 동의한 것으로 간주합니다.</p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">제4조 (회원 가입 및 탈퇴)</h2>
            <p>회원 가입은 소셜 로그인(Google, Kakao)을 통해 진행됩니다. 회원 탈퇴를 원하시면 admin@jumjuhub.com으로 요청해 주시면 처리됩니다.</p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">제5조 (금지 행위)</h2>
            <ul className="space-y-1 list-disc list-inside text-gray-600">
              <li>타인을 비방하거나 허위 정보를 유포하는 행위</li>
              <li>영리 목적의 광고성 게시물 무단 게재</li>
              <li>타인의 개인정보 수집 또는 도용</li>
              <li>서비스의 안정적 운영을 방해하는 행위</li>
              <li>관계 법령에 위반되는 행위</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">제6조 (게시물 관리)</h2>
            <p>회사는 금지 행위에 해당하거나 다른 회원의 신고를 받은 게시물을 사전 통보 없이 삭제하거나 블라인드 처리할 수 있습니다. 공정위 데이터 등 서비스 내 정보는 참고용이며, 실제 계약·투자 전 반드시 공식 기관을 통해 확인하시기 바랍니다.</p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">제7조 (면책 조항)</h2>
            <p>회사는 천재지변, 서버 장애 등 불가항력에 의해 발생한 손해에 대해 책임을 지지 않습니다. 또한 회원 간 분쟁에 대해 회사는 책임을 지지 않습니다.</p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">제8조 (분쟁 해결)</h2>
            <p>본 약관과 관련된 분쟁은 대한민국 법률을 준거법으로 하며, 관할 법원은 민사소송법에 따릅니다.</p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">문의</h2>
            <p>이용약관에 관한 문의는 <a href="mailto:admin@jumjuhub.com" className="text-green-700 underline">admin@jumjuhub.com</a>으로 연락해 주세요.</p>
          </section>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">← 홈으로</Link>
        </div>
      </main>
    </div>
  );
}
