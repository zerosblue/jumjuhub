import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: bigint | number | null | undefined): string {
  if (amount === null || amount === undefined) return "-";
  const num = typeof amount === "bigint" ? Number(amount) : amount;
  if (num >= 100000000) return `${(num / 100000000).toFixed(1)}억원`;
  if (num >= 10000) return `${(num / 10000).toFixed(0)}만원`;
  return `${num.toLocaleString()}원`;
}

export function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined) return "-";
  return n.toLocaleString();
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return formatDate(date);
}

export function toBrandSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\wㄱ-힝가-힣-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function boardTypeLabel(type: string): { label: string; icon: string } {
  const map: Record<string, { label: string; icon: string }> = {
    NOTICE: { label: "공지", icon: "📋" },
    QNA: { label: "예비창업자 질문", icon: "❓" },
    REVIEW: { label: "점주 실제후기", icon: "⭐" },
    FREE: { label: "자유게시판", icon: "💬" },
    REPORT_ABUSE: { label: "본사 갑질 제보", icon: "😤" },
    TRADE: { label: "점포 양도/물품 거래", icon: "🛒" },
  };
  return map[type] ?? { label: type, icon: "📌" };
}

export function hashIp(ip: string): string {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
