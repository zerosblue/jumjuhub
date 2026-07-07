// 소상공인시장진흥공단 상가(상권)정보 API 업종분류 매핑
// 공정위 업종(중분류명) → 상권정보 업종코드 (대/중/소분류)
// 코드표: apis.data.go.kr/B553077/api/open/sdsc2/{middle,small}UpjongList

export type UpjongFilter = {
  indsLclsCd?: string;
  indsMclsCd?: string;
  indsSclsCd?: string;
  label: string;
};

const MAP: Record<string, UpjongFilter> = {
  치킨: { indsSclsCd: "I21006", label: "치킨" },
  피자: { indsSclsCd: "I21003", label: "피자" },
  패스트푸드: { indsSclsCd: "I21004", label: "버거" },
  한식: { indsMclsCd: "I201", label: "한식" },
  중식: { indsMclsCd: "I202", label: "중식" },
  일식: { indsMclsCd: "I203", label: "일식" },
  서양식: { indsMclsCd: "I204", label: "서양식" },
  기타외국식: { indsMclsCd: "I206", label: "기타 외국식" },
  제과제빵: { indsSclsCd: "I21001", label: "제과·제빵" },
  분식: { indsSclsCd: "I21007", label: "김밥·분식" },
  주점: { indsMclsCd: "I211", label: "주점" },
  커피: { indsSclsCd: "I21201", label: "카페" },
  음료: { indsMclsCd: "I212", label: "커피·음료" },
  아이스크림: { indsSclsCd: "I21008", label: "아이스크림·빙수" },
  편의점: { indsSclsCd: "G20405", label: "편의점" },
};

const KEYWORD_FALLBACK: Array<[RegExp, UpjongFilter]> = [
  [/치킨/, MAP["치킨"]],
  [/피자/, MAP["피자"]],
  [/버거|햄버거/, MAP["패스트푸드"]],
  [/아이스크림|빙수/, MAP["아이스크림"]],
  [/커피|카페/, MAP["커피"]],
  [/음료|주스/, MAP["음료"]],
  [/제과|제빵|베이커리|도넛|빵|떡/, MAP["제과제빵"]],
  [/분식|김밥|만두/, MAP["분식"]],
  [/주점|호프|포차|맥주/, MAP["주점"]],
  [/한식|국밥|찌개|고기|족발|보쌈/, MAP["한식"]],
  [/편의점/, MAP["편의점"]],
];

export function resolveUpjong(subcategory: string | null, category: string, brandName?: string): UpjongFilter | null {
  // 공정위 업종이 뭉뚱그려진 경우 브랜드명으로 세분류 보정 (예: 이삭토스트 → 분식이 아닌 토스트)
  if (brandName && /토스트|샌드위치|샐러드/.test(brandName)) {
    return { indsSclsCd: "I21005", label: "토스트·샌드위치" };
  }
  const key = (subcategory ?? "").trim();
  if (key && MAP[key]) return MAP[key];
  for (const [re, f] of KEYWORD_FALLBACK) {
    if (re.test(key)) return f;
  }
  if (category === "외식") return { indsLclsCd: "I2", label: "음식점 전체" };
  if (category === "도소매") return { indsLclsCd: "G2", label: "소매 전체" };
  return null;
}
