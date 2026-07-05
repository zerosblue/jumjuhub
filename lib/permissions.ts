export type VerifyLevel = "NONE" | "SELF" | "VERIFIED";
export type UserRole = "USER" | "ADMIN";

// 읽기 최소 조건: public | loggedIn
const BOARD_READ_MIN: Record<string, "public" | "loggedIn"> = {
  NOTICE: "public",
  QNA: "public",
  FREE: "public",
  TRADE: "public",
  REVIEW: "loggedIn",
  REPORT_ABUSE: "loggedIn",
  REVENUE: "loggedIn",
  LEGAL: "loggedIn",
  CLOSURE: "loggedIn",
};

// 쓰기 최소 조건: loggedIn | self | verified | admin
const BOARD_WRITE_MIN: Record<string, "loggedIn" | "self" | "verified" | "admin"> = {
  NOTICE: "admin",
  QNA: "loggedIn",
  FREE: "loggedIn",
  TRADE: "loggedIn",
  REVIEW: "self",
  REPORT_ABUSE: "verified",
  REVENUE: "verified",
  LEGAL: "self",
  CLOSURE: "self",
};

export function canReadBoard(
  board: string,
  isLoggedIn: boolean,
  verifyLevel: VerifyLevel,
  role: UserRole
): boolean {
  if (role === "ADMIN") return true;
  const min = BOARD_READ_MIN[board] ?? "loggedIn";
  if (min === "public") return true;
  return isLoggedIn;
}

export function canWriteBoard(
  board: string,
  isLoggedIn: boolean,
  verifyLevel: VerifyLevel,
  role: UserRole
): boolean {
  if (role === "ADMIN") return true;
  if (!isLoggedIn) return false;
  const min = BOARD_WRITE_MIN[board];
  if (!min || min === "admin") return false;
  if (min === "loggedIn") return true;
  if (min === "self") return verifyLevel === "SELF" || verifyLevel === "VERIFIED";
  if (min === "verified") return verifyLevel === "VERIFIED";
  return false;
}

export function writeBlockReason(
  board: string,
  isLoggedIn: boolean,
  verifyLevel: VerifyLevel
): string | null {
  if (!isLoggedIn) return "로그인이 필요합니다.";
  const min = BOARD_WRITE_MIN[board];
  if (!min || min === "admin") return "관리자 전용 게시판입니다.";
  if (min === "loggedIn") return null;
  if (min === "self") {
    if (verifyLevel === "NONE") return "점주 자기인증 후 작성 가능합니다.";
    return null;
  }
  if (min === "verified") {
    if (verifyLevel === "NONE") return "공식 인증점주만 작성 가능합니다.";
    if (verifyLevel === "SELF") return "사업자등록증 인증 후 작성 가능합니다.";
    return null;
  }
  return null;
}
