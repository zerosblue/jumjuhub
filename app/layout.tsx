import type { Metadata, Viewport } from "next";
import { SessionProvider } from "next-auth/react";
import NicknameGuard from "@/components/NicknameGuard";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | 점주허브",
    default: "점주허브 - 진짜 점주들의 솔직한 이야기",
  },
  description:
    "프랜차이즈 가맹점주와 예비창업자를 위한 커뮤니티. 브랜드 가맹비, 평균매출, 창업비용, 점주 후기를 확인하세요.",
  keywords: ["프랜차이즈", "가맹점", "점주", "창업", "가맹비", "평균매출", "점주허브"],
  authors: [{ name: "점주허브" }],
  creator: "점주허브",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://jumjuhub.com",
    siteName: "점주허브",
    title: "점주허브 - 진짜 점주들의 솔직한 이야기",
    description: "프랜차이즈 가맹점주와 예비창업자를 위한 커뮤니티 플랫폼",
    images: [
      {
        url: "https://jumjuhub.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "점주허브 - 진짜 점주들의 솔직한 이야기",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://jumjuhub.com/og-image.png"],
  },
  manifest: "/manifest.json",
  verification: {
    google: "JhC2WfwMuwTgmf92Y7qlzWycrflGkCe74K4GvNuPYQc",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a5c38",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full bg-gray-50 font-sans antialiased">
        <SessionProvider>
          <NicknameGuard />
          <ServiceWorkerRegister />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
