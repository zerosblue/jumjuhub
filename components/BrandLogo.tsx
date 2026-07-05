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
  "페리카나": "pelicana.co.kr",
  "치킨마루": "chickenmaru.co.kr",
  "이비닭": "ebidak.com",
  "치킨플러스": "chickenplus.co.kr",
  "오발탄": "obaltan.co.kr",
  "파파이스": "popeyes.co.kr",
  "써브웨이치킨": "subway.com",
  "두마리치킨": "dumarichicken.co.kr",
  "스타치킨": "starchicken.co.kr",
  "갓튀긴치킨": "gottwigin.co.kr",
  "통큰치킨": "tongkeun.co.kr",
  "치킨파티": "chickenparty.co.kr",
  "뿌리치킨": "ppurichicken.com",
  "불사조치킨": "bulchicken.co.kr",
  "홈치킨": "homechicken.co.kr",
  "나는자연인이다치킨": "naturechicken.co.kr",
  "이웃집통닭": "neigchicken.com",
  // 커피·음료 추가
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
  "아이스베리": "iceberry.co.kr",
  "셀렉토커피": "selecto.co.kr",
  "팀홀튼": "timhortons.co.kr",
  "더리터": "theliter.co.kr",
  "커피베이": "coffeebay.co.kr",
  "비씨비씨": "bcbc.co.kr",
  "로얄밀크티": "royalmilktea.co.kr",
  "마노핀": "manopin.com",
  "버블티": "bubbletea.co.kr",
  "공차(GONG CHA)": "gongcha.co.kr",
  "카페너마저": "cafenemajeo.co.kr",
  "카페로제": "caferose.co.kr",
  // 분식·떡볶이·토스트
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
  "아딸": "attal.co.kr",
  "명랑핫도그": "mynl.co.kr",
  "학교앞떡볶이": "schooltteok.co.kr",
  "분식이야": "bunsik.co.kr",
  "가가호호": "gagahohohk.co.kr",
  "오빠네포장마차": "oppapocha.co.kr",
  "노가리야": "nogaria.co.kr",
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
  "가마로강정": "gamarogangjung.com",
  "채선당": "chaesundang.com",
  "국수나무": "noodletree.co.kr",
  "명동교자": "myeongdonggyoja.com",
  "자연별곡": "jayeonbyulgok.co.kr",
  "계절밥상": "fresh.cj.net",
  "제주올레": "jeju-olle.or.kr",
  "한일관": "hanilkwan.com",
  "하남돼지집": "hanamhouse.com",
  "육전식당": "yukjeon.co.kr",
  "기와집순두부": "giwajip.com",
  "두끼떡볶이": "dookki.com",
  "임실N치즈": "imsil.co.kr",
  "더본코리아": "theborn.co.kr",
  "맥시밥": "maxibab.com",
  "오복만두": "obokmanndoo.co.kr",
  "삼겹살의민족": "samgyeopsal.co.kr",
  "고기싸롱": "gochissalong.com",
  "돼지마을": "pigvillage.co.kr",
  "숙성도": "sukseongdo.com",
  "미정국수0410": "mijeong.co.kr",
  "대감집": "daegamjip.com",
  "돈돈정": "dondonjeong.co.kr",
  // 중식
  "중화반점": "joonghwa.co.kr",
  "한중촌": "hanjungchon.co.kr",
  // 일식
  "스시로": "sushiro.co.kr",
  "오마카세": "omakase.co.kr",
  "와타미": "watami.co.kr",
  "온더보더": "ontheborder.co.kr",
  "가쓰야": "katsuya.co.kr",
  "오사카라멘": "osakaramen.co.kr",
  "요시야": "yoshiya.co.kr",
  "산마루": "sanmaru.co.kr",
  "모스버거": "mosburger.co.kr",
  "스시야": "sushiya.co.kr",
  "야키토리": "yakitori.co.kr",
  "돈카츠야": "donkatsya.co.kr",
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
  "닥터와플": "drwaffle.com",
  "허니버터칩": "hbchip.co.kr",
  "롤아이스크림": "rollicecream.co.kr",
  "레드망고": "redmango.co.kr",
  "요거베리": "yogurberry.com",
  "씨앤블루": "cnblue.co.kr",
  "죤쿡델리미트": "johncooke.co.kr",
  // 베이커리
  "파리바게뜨(PARIS BAGUETTE)": "paris.co.kr",
  "뚜레쥬르(TOUS les JOURS)": "tlj.co.kr",
  "breadfield": "breadfield.co.kr",
  "아티제": "artisee.com",
  "성심당": "sungsimdang.com",
  "브레드피트": "breadpitt.com",
  "나폴레옹제과": "napoleon.co.kr",
  "신라명과": "shilla-baking.co.kr",
  "빵굽는마을": "bakingvillage.co.kr",
  "브레드메이저": "breadmajor.com",
  "밀다원": "mildawon.co.kr",
  "오뗄": "otel.co.kr",
  // 패밀리레스토랑·뷔페 추가
  "TGI프라이데이스": "tgif.co.kr",
  "T.G.I. FRIDAY'S": "tgif.co.kr",
  "오니기리와이규동": "onigiri.co.kr",
  "토다이": "todai.co.kr",
  // 편의식품·기타 외식
  "롤링파스타": "rollingpasta.co.kr",
  "스파게띠아": "spaghettia.co.kr",
  "시즐러": "sizzler.co.kr",
  "라그릴리아": "lagriglia.co.kr",
  "더플레이스": "theplace.co.kr",
  "오므라이스키친": "omerice.co.kr",
  "매드포갈릭": "madforgarlic.com",
  "피쉬앤그릴": "fishandgrill.co.kr",
  "클라인가르텐": "kleingarten.co.kr",
  "고봉정": "gobongjeong.co.kr",
  // 주점·펍
  "봉구비어": "bonggoobeer.com",
  "치어스": "cheers.co.kr",
  "세계맥주": "worldbeer.co.kr",
  "와라와라": "warawara.co.kr",
  "호프나라": "hopnaara.co.kr",
  "땡스오브": "thanksof.co.kr",
  "이차돌": "ichadol.com",
  // 뷰티·미용
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
  "준오헤어": "junohair.com",
  "리안헤어": "lianhair.com",
  "블루클럽": "blueclub.co.kr",
  "박승철헤어스튜디오": "psw.co.kr",
  "이철헤어커커": "iche.co.kr",
  "헤어짱": "hairjjang.com",
  "레드헤어클럽": "redhairclub.co.kr",
  "이미인": "eimiin.co.kr",
  "아름다운사람들": "beautiful.co.kr",
  "다나헤어": "danahair.co.kr",
  // 교육
  "눈높이": "daekyo.com",
  "빨간펜": "iyamam.com",
  "웅진씽크빅": "wjthinkbig.co.kr",
  "윤선생": "yoons.com",
  "재능교육": "jei.com",
  "천재교육": "chunjae.co.kr",
  "시매쓰": "cmaths.com",
  "CMS에듀": "cmsedu.com",
  "구몬": "kumon.co.kr",
  "교원": "kyowon.co.kr",
  "아이스크림홈런": "i-scream.co.kr",
  "밀크T": "milkt.co.kr",
  "해법수학": "haebup.co.kr",
  "에이쁠": "aplus.co.kr",
  "청담어학원": "cdlec.com",
  "정상어학원": "jeongsangedu.com",
  "파고다어학원": "pagoda21.com",
  "YBM어학원": "ybmseoul.com",
  "대교": "daekyo.com",
  // 생활·세탁·기타
  "다이소": "daiso.co.kr",
  "아성다이소": "daiso.co.kr",
  "크린토피아": "cleantopia.com",
  "세탁특공대": "cleaningheroes.co.kr",
  "홈케어서비스": "homecare.co.kr",
  "미스터멘딩": "mrmending.co.kr",
  "해피빨래방": "happywash.co.kr",
  "워시엔조이": "wishendjoy.com",
  "크린에이드": "cleanaid.co.kr",
  "크린업서비스": "cleanupservice.co.kr",
  "홈플러스": "homeplus.co.kr",
  // 반려동물
  "펫프렌즈": "petfriends.co.kr",
  "하울팟": "howlpot.com",
  "라라펫": "lalapets.co.kr",
  "도그워크": "dogwalk.co.kr",
  "러브펫": "lovepet.co.kr",
  "포인핸드": "poinhnd.com",
  "킹덤펫": "kingdompet.co.kr",
  // 헬스·스포츠·필라테스
  "스포애니": "spoany.co.kr",
  "커브스": "curves.co.kr",
  "필라피트": "pilafit.co.kr",
  "핏앤필": "fitnfeel.co.kr",
  "엘리트스포츠": "elitesports.co.kr",
  "GX학원": "gxhakwon.co.kr",
  "에이블짐": "ablezym.com",
  "피트니스월드": "fitnessworld.co.kr",
  "와이즈피트니스": "wisefitness.co.kr",
  // 부동산·이사
  "다방": "dabangapp.com",
  "직방": "zigbang.com",
  "이사모아": "easamoa.com",
  // 자동차 관련
  "오일나라": "oilnara.co.kr",
  "카포스": "kapos.or.kr",
  "SK엔카": "encar.com",
  // 여행·숙박
  "이비스호텔": "ibis.com",
  "아코르호텔": "accor.com",
  // 치킨 변형·추가
  "처갓집양념치킨": "cheogajip.co.kr",
  "치킨매니아": "chickenmania.co.kr",
  "홍초불닭": "hongcho.co.kr",
  "봉구스밥버거": "bongkus.com",
  "후라이드참잘하는집": "friedkr.co.kr",
  "두찜": "doojjim.co.kr",
  "에이스치킨": "acechicken.co.kr",
  "올가치킨": "olgachicken.co.kr",
  "나이스치킨": "nicechicken.co.kr",
  "굿윙스": "goodwings.co.kr",
  "인생치킨": "inseangchicken.com",
  // 커피·음료 변형·추가
  "커피스미스": "coffeesmith.co.kr",
  "자바시티": "javacity.co.kr",
  "글로리아진스": "gloriajeanscoffees.co.kr",
  "이디야(EDIYA COFFEE)": "ediya.com",
  "투썸플레이스(TWOSOME PLACE)": "twosome.co.kr",
  "빽다방(PAIK'S COFFEE)": "paik.co.kr",
  "카페봄봄(CAFE BOM BOM)": "cafebombom.com",
  "버블로지": "bubblology.com",
  "공차코리아": "gongcha.co.kr",
  "더착한커피(Good Coffee)": "goodcoffee.co.kr",
  "빈스앤베리즈": "beansandberries.co.kr",
  "카페온더블랙": "cafeontheblack.com",
  "씨드커피": "seedcoffee.co.kr",
  "에스프레소바": "espressobar.co.kr",
  // 피자 추가
  "피자스쿨": "pizzaschool.co.kr",
  "반올림피자샵": "banorimza.co.kr",
  "피자마루": "pizzamaru.com",
  "7번가피자": "7bungapizza.co.kr",
  "도미노(Domino's Pizza)": "dominos.co.kr",
  // 패스트푸드·버거 추가
  "웬디스": "wendys.co.kr",
  "타코벨": "tacobell.co.kr",
  "맥도날드(McDonald's)": "mcdonalds.com",
  "버거킹(Burger King)": "burgerking.com",
  "롯데리아(Lotteria)": "lotteria.com",
  // 한식·고기 추가
  "봉피양": "bongpiang.com",
  "투다리": "toodary.co.kr",
  "신포우리만두": "shinpomandu.co.kr",
  "홍콩반점0410": "hongkongbanjum.com",
  "강가네감자탕": "gangganejatang.co.kr",
  "한촌설렁탕(HANCHON)": "hanchon.com",
  "새마을식당(SAEMAUL SIKDANG)": "saemaul.com",
  "원할머니보쌈": "bossam.co.kr",
  "놀부보쌈족발": "nolboo.co.kr",
  "놀부항아리갈비": "nolboo.co.kr",
  "수미네반찬": "suminesite.com",
  "풍년샤브": "poongnyun.com",
  "장충동왕족발": "jangchungdon.com",
  "팔공산왕족발": "palgongzok.co.kr",
  "참이슬삼겹살": "chamcham.co.kr",
  "연탄불고기": "yeontanbulgogi.co.kr",
  "고기굽는남자": "gogimany.co.kr",
  "화로구이": "harogui.co.kr",
  "짚불막창": "zipbulmakchang.co.kr",
  "개화기": "gaehwagi.co.kr",
  "한신포차(HANSHIN POCHA)": "hanshinpocha.com",
  "고봉민김밥천국": "gobongmin.com",
  "김가네": "kimgane.com",
  // 국수·냉면·만두
  "유가네닭갈비": "yukane.com",
  "청년닭갈비": "chungnyon-dak.co.kr",
  "원조평양냉면": "pyeongyang.co.kr",
  "을지면옥": "euljimyeonok.co.kr",
  // 주점·펍 추가
  "봉구비어(BONGGU BEER)": "bonggoobeer.com",
  "황금에이스": "hwangeumeace.com",
  "포차야": "pochaya.co.kr",
  "한집술집": "hanjipsul.co.kr",
  "24시술집": "24sulzip.co.kr",
  // 뷰티·화장품
  "아모레퍼시픽": "apgroup.com",
  "LG생활건강": "lgcare.com",
  "설화수": "sulwhasoo.com",
  "헤라": "hera.com",
  "라네즈": "laneige.com",
  "마몽드": "mamonde.co.kr",
  "이니스프리(innisfree)": "innisfree.com",
  "에뛰드하우스": "etude.com",
  "아이오페": "iope.com",
  "려": "ryoe.com",
  "닥터자르트": "drjart.com",
  "롬앤": "romand.co.kr",
  "3CE": "3ce.com",
  "어뮤즈": "amuse.kr",
  "뮬라웨어": "moolaunderwear.com",
  "APM": "apmplace.com",
  // 교육 추가
  "한솔교육": "hansoledu.co.kr",
  "메가스터디": "megastudy.net",
  "이투스": "etoos.com",
  "삼성영어": "samsungenglish.co.kr",
  "에듀플렉스": "eduplex.net",
  "교원에듀": "kyowonedu.com",
  "스카이에듀": "skyedu.co.kr",
  "종로학원": "jongro.co.kr",
  "대성학원": "daesung.co.kr",
  "정상JLS": "jls.co.kr",
  "청솔학원": "chungsolacdemy.com",
  "씨앤씨": "cnc.co.kr",
  "리딩게이트": "readinggate.com",
  "한우리독서토론논술": "hanuribook.com",
  "공부방아이": "gongbubangi.com",
  // 마트·유통
  "이마트": "emart.com",
  "롯데마트": "lottemart.com",
  "홈플러스익스프레스": "homeplus.co.kr",
  "롯데슈퍼": "lottesuper.co.kr",
  "GS슈퍼마켓": "gssuper.gsretail.com",
  "코스트코": "costco.co.kr",
  "킴스클럽": "kimsclub.lotteshopping.com",
  // 주유소·자동차
  "GS칼텍스": "gscaltex.com",
  "SK에너지": "skenergy.co.kr",
  "S-OIL": "s-oil.com",
  "현대오일뱅크": "hyundaioilbank.com",
  "스피드메이트": "speedmate.com",
  "오토오아시스": "autooasis.co.kr",
  "카마스터": "camaster.co.kr",
  // 인테리어·가구
  "한샘": "hanssem.com",
  "리바트": "livart.co.kr",
  "까사미아": "casamia.co.kr",
  "이케아": "ikea.com",
  // 통신
  "SKT직영점": "sktelecom.com",
  "KT직영점": "kt.com",
  "LG유플러스": "lguplus.com",
  // 숙박·여행
  "모텔스닷컴": "motels.com",
  "야놀자": "yanolja.co.kr",
  "여기어때": "goodchoice.kr",
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
