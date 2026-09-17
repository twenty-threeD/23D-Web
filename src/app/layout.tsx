import type { Metadata } from "next";
import { Toast } from "@/src/components/ui/toaster"
import localFont from "next/font/local";
import "./globals.css";
import AuthProvider from "@/src/components/AuthProvider";
import BlockMobile from "@/src/components/BlockMobile";
import SiteChrome from "@/src/components/SiteChrome";
import CallProvider from "@/src/components/call/CallProvider";

// Pretendard 는 next/font/google 에 없어 가변 폰트 파일을 직접 두고 self-host 한다.
// 가변 폰트 한 파일로 시안의 모든 굵기(Medium 등)를 커버한다
const pretendard = localFont({
  src: "../../public/fonts/PretendardVariable.woff2",
  variable: "--font-pretendard-local",
  weight: "45 920",
  display: "swap",
});

export const metadata: Metadata = {
  title: "잇다",
  description: "2026년 2학년 23D의 나르샤 프로젝트입니다",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${pretendard.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <SiteChrome>{children}</SiteChrome>
          {/* 걸려온 전화는 채팅방 밖에서도 받아야 해서 전역에 둔다 */}
          <CallProvider />
        </AuthProvider>
        <BlockMobile />
        <Toast />
      </body>
    </html>
  );
}
