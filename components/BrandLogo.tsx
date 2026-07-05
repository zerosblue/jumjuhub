"use client";

import { useState } from "react";
import { Store } from "lucide-react";

// 주요 한국 프랜차이즈 공식 도메인 매핑
const DOMAIN_MAP: Record<string, string> = {
  // 편의점
  "씨유(CU)": "cu.bgfretail.com",
  "CU": "cu.bgfretail.com",
  "GS25": "gs25.gsretail.com",
  "지에스25(GS25)": "gs25.gsretail.com",
  "세븐일레븐": "7-eleven.co.kr",
  "이마트24": "emart24.co.kr",
  "이마트24(emart24)": "emart24.co.kr",
  "미니스톱": "ministop.co.kr",
  "GS THE FRESH": "gsthefresh.gsretail.com",
  // 치킨
  "BBQ": "bbq.co.kr",
  "BHC": "bhcchicken.com",
  "비에이치씨(BHC)": "bhcchicken.com",
  "교촌치킨": "kyochon.com",
  "네네치킨": "nene.co.kr",
  "굽네치킨": "goobne.com",
  "처갓집": "cheogajip.co.kr",
  "푸라닭": "puradak.com",
  "노랑통닭": "yellowchicken.co.kr",
  "60계치킨": "60chicken.co.kr",
  "맥시카나": "mexicana.co.kr",
  "호식이두마리치킨": "hosik.co.kr",
  "지코바": "zikoba.co.kr",
  "깐부치킨": "gganbu.co.kr",
  // 커피·음료
  "메가커피": "mega-coffee.co.kr",
  "메가엠지씨커피(MEGA MGC COFFEE)": "mega-coffee.co.kr",
  "MEGA MGC COFFEE": "mega-coffee.co.kr",
  "컴포즈커피": "composecoffee.com",
  "컴포즈커피(COMPOSE COFFEE)": "composecoffee.com",
  "COMPOSE COFFEE": "composecoffee.com",
  "빽다방": "paik.co.kr",
  "이디야커피": "ediya.com",
  "스타벅스": "starbucks.co.kr",
  "투썸플레이스": "twosome.co.kr",
  "할리스": "hollys.co.kr",
  "엔제리너스": "angelinus.com",
  "파스쿠찌": "pascucci.co.kr",
  "커피빈": "coffeebeankorea.com",
  "폴바셋": "paulbassett.co.kr",
  "탐앤탐스": "tomntoms.com",
  "드롭탑": "droptop.co.kr",
  "카페베네": "cafebene.com",
  "더벤티": "theventi.co.kr",
  "요거트월드": "yogurtworld.co.kr",
  "스무디킹": "smoothieking.co.kr",
  "쥬씨": "juicy.co.kr",
  "공차": "gongcha.co.kr",
  // 패스트푸드·버거
  "롯데리아": "lotteria.com",
  "맥도날드": "mcdonalds.com",
  "버거킹": "burgerking.com",
  "KFC": "kfc.co.kr",
  "서브웨이": "subway.com",
  "맘스터치": "momstouch.co.kr",
  "노브랜드버거": "nobrandburgerkr.com",
  "쉐이크쉑": "shakeshack.co.kr",
  "파이브가이즈": "fiveguys.co.kr",
  // 제과·베이커리·아이스크림
  "파리바게뜨": "paris.co.kr",
  "뚜레쥬르": "tlj.co.kr",
  "던킨": "dunkindonuts.co.kr",
  "배스킨라빈스": "baskinrobbins.co.kr",
  "크리스피크림": "krispykreme.co.kr",
  "뚜뚜뚜": "tutututu.co.kr",
  // 한식·분식·도시락
  "한솥": "hansot.com",
  "새마을식당": "saemaul.com",
  "본도시락": "bon.co.kr",
  "한촌설렁탕": "hanchon.com",
  "홍콩반점": "hongkongbanjum.com",
  "쭈꾸미샤브샤브": "zzu.co.kr",
  "국대떡볶이": "kukdae.com",
  "죠스떡볶이": "jaws.co.kr",
  "신전떡볶이": "sinduck.com",
  "오마이치즈": "ohmycheese.co.kr",
  // 피자
  "도미노피자": "dominos.co.kr",
  "피자헛": "pizzahut.co.kr",
  "미스터피자": "mrpizza.co.kr",
  "피자알볼로": "pizzaalbolo.com",
  "피자나라치킨공주": "pizzanara.co.kr",
  "청년피자": "chungnyon.co.kr",
  // 패밀리레스토랑·뷔페
  "아웃백": "outback.co.kr",
  "빕스": "vips.co.kr",
  "애슐리": "ashley.co.kr",
  "쿠우쿠우": "coucou.co.kr",
  // 치킨 추가
  "바른치킨": "bareunchicken.com",
  "또봉이통닭": "ddobongi.com",
  "생생치킨": "saengsaengchicken.com",
  "훌랄라": "hoolala.co.kr",
  "자담치킨": "jadamchicken.com",
  "땅땅치킨": "ddangddang.co.kr",
  "원할머니보쌈족발": "bossam.co.kr",
  "스모프치킨": "smof.co.kr",
  "빠른치킨": "babareunchicken.com",
  "멕시카나치킨": "mexicana.co.kr",
  // 커피 추가
  "달콤커피": "dalkomcoffee.com",
  "카페봄봄": "cafebombom.com",
  "더착한커피": "goodcoffee.co.kr",
  "커피에반하다": "coffeeinlove.co.kr",
  "빈브라더스": "beanbrothers.co.kr",
  "커피나무": "coffeenamu.com",
  "쥬씨(JUICY)": "juicy.co.kr",
  "요거프레소": "yogerpresso.com",
  "망고식스": "mangosix.co.kr",
  "카페띠아모": "tiamokorea.co.kr",
  "카페인24": "cafe24.com",
  "아이스베리": "iceberry.co.kr",
  // 분식·떡볶이
  "엽기떡볶이": "yupdduk.com",
  "떡볶이의신": "tteokbokkimaster.com",
  "동대문엽기떡볶이": "yupdduk.com",
  "이삭토스트": "isaactoast.com",
  "바르다김선생": "bardakimseon.com",
  "역전할머니맥주": "yukjeon.com",
  "명인만두": "myeonginmandu.com",
  "홍루이젠": "hongruijen.co.kr",
  "어묵대왕": "eomukdaewang.co.kr",
  "청년다방": "chungnyundabang.com",
  // 한식·고기
  "한신포차": "hanshinpocha.com",
  "서가앤쿡": "seogaandcook.com",
  "고봉민김밥": "gobongmin.com",
  "김밥천국": "gimbabcheonguk.com",
  "본죽": "bonjuk.com",
  "본죽&비빔밥카페": "bonjuk.com",
  "놀부부대찌개": "nolboo.co.kr",
  "원앤원참숯바베큐": "oneandone.co.kr",
  "제너시스BBQ": "bbq.co.kr",
  "또래오래": "ttoraeorae.co.kr",
  "육쌈냉면": "yukssam.com",
  "청년이삼겹": "chungnyunisam.com",
  "산들해": "sandleuhae.com",
  // 아이스크림·디저트
  "나뚜루": "natuur.co.kr",
  "하겐다즈": "haagendazs.co.kr",
  "메리퀸": "merryqueen.co.kr",
  "소프트리": "softree.co.kr",
  "탐앤탐스(TOM N TOMS)": "tomntoms.com",
  "설빙": "sulbing.com",
  "와플대학": "waffleuniv.com",
  "달려라치킨": "dalryeochicken.com",
  "밀크카우": "milkcow.kr",
  // 편의식품·기타 외식
  "롤링파스타": "rollingpasta.co.kr",
  "스파게띠아": "spaghettia.co.kr",
  "시즐러": "sizzler.co.kr",
  "라그릴리아": "lagriglia.co.kr",
  "더플레이스": "theplace.co.kr",
  "오므라이스키친": "omerice.co.kr",
  // 뷰티·건강
  "올리브영": "oliveyoung.co.kr",
  "이니스프리": "innisfree.com",
  "네이처리퍼블릭": "naturerepublic.com",
  "미샤": "missha.com",
  "에뛰드": "etude.com",
  "토니모리": "tonymoly.com",
  "더페이스샵": "thefaceshop.com",
  "스킨푸드": "skinfood.co.kr",
  "클리오": "clio-cosmetics.com",
  "리더스코스메틱": "leaderscosmetics.com",
  // 교육
  "눈높이": "daekyo.com",
  "빨간펜": "iyamam.com",
  "웅진씽크빅": "wjthinkbig.co.kr",
  "윤선생": "yoons.com",
  "재능교육": "jei.com",
  "천재교육": "chunjae.co.kr",
  "시매쓰": "cmaths.com",
  "CMS에듀": "cmsedu.com",
  // 생활·세탁·기타
  "다이소": "daiso.co.kr",
  "아성다이소": "daiso.co.kr",
  "크린토피아": "cleantopia.com",
  "세탁특공대": "cleaningheroes.co.kr",
  "홈케어서비스": "homecare.co.kr",
  "미스터멘딩": "mrmending.co.kr",
  "해피빨래방": "happywash.co.kr",
  // 반려동물
  "펫프렌즈": "petfriends.co.kr",
  "하울팟": "howlpot.com",
  "라라펫": "lalapets.co.kr",
  // 중고·리셀
  "아이콘박스": "iconbox.co.kr",
  // 헬스·스포츠
  "스포애니": "spoany.co.kr",
  "커브스": "curves.co.kr",
  "필라피트": "pilafit.co.kr",
};

function googleFavicon(domain: string): string {
  return `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`;
}

function getLogoSrc(name: string, logoUrl?: string | null): string | null {
  // 1. DB에 저장된 로고
  if (logoUrl && !logoUrl.includes("clearbit")) return logoUrl;

  // 2. 브랜드명 또는 추출 영문명으로 DOMAIN_MAP 조회
  const paren = name.match(/\(([A-Za-z0-9 &'.\-]+)\)/);
  const en = paren ? paren[1].trim() : /^[A-Za-z0-9 &'.\-]+$/.test(name) ? name.trim() : null;

  const domain = DOMAIN_MAP[name.trim()] ?? (en ? DOMAIN_MAP[en] : null);
  if (domain) return googleFavicon(domain);

  // 3. 영문명 → Google 파비콘 시도
  if (en) {
    const slug = en.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (slug) return googleFavicon(`${slug}.co.kr`);
  }

  return null;
}

interface BrandLogoProps {
  name: string;
  logoUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE = {
  sm: { box: "w-5 h-5", text: "text-xs", icon: 12 },
  md: { box: "w-8 h-8", text: "text-sm", icon: 16 },
  lg: { box: "w-16 h-16", text: "text-2xl", icon: 28 },
};

export default function BrandLogo({ name, logoUrl, size = "md", className = "" }: BrandLogoProps) {
  const src = getLogoSrc(name, logoUrl);
  const [failed, setFailed] = useState(false);
  const s = SIZE[size];

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setFailed(true)}
        className={`${s.box} rounded-lg object-contain border border-gray-100 bg-white shrink-0 ${className}`}
      />
    );
  }

  if (size === "lg") {
    return (
      <div className={`${s.box} rounded-xl bg-green-50 flex items-center justify-center shrink-0 ${className}`}>
        <Store size={s.icon} className="text-green-600" />
      </div>
    );
  }

  return (
    <div className={`${s.box} rounded bg-green-800 flex items-center justify-center text-white font-black shrink-0 ${className}`}>
      <span className={s.text}>{name[0]}</span>
    </div>
  );
}
