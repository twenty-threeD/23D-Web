import type { Metadata } from "next";
import { Toast } from "@/src/components/ui/toaster"
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/src/components/AuthProvider";
import BlockMobile from "@/src/components/BlockMobile";
import SiteChrome from "@/src/components/SiteChrome";
import CallProvider from "@/src/components/call/CallProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
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
