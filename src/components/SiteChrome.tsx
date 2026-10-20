"use client"

import { usePathname } from "next/navigation"
import Header from "@/src/components/Header"
import Footer from "@/src/components/Footer"
import BottomNav from "@/src/components/BottomNav"

function isAuthPath(pathname: string) {
  return pathname.startsWith("/login") || pathname === "/oauth/success"
}

function isPaymentResultPath(pathname: string) {
  return pathname === "/pay/fail" || pathname === "/pay/success"
}

function hasFooter(pathname: string) {
  return !isAuthPath(pathname) && !isPaymentResultPath(pathname) && !pathname.startsWith("/chat") && !pathname.startsWith("/upload")
}

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showHeader = pathname !== "/" && !isAuthPath(pathname) && !isPaymentResultPath(pathname)
  // 대화방 안에서는 입력창이 화면 맨 아래에 붙어야 해서 하단 메뉴를 숨긴다(목록으로 돌아가는 버튼이 따로 있다)
  const showBottomNav = showHeader && !/^\/chat\/[^/]+/.test(pathname)

  return (
    <>
      {/* 래퍼가 박스를 만들면 Header의 sticky가 이 div 높이 안에 갇혀 스크롤 시 사라진다 */}
      <div className={showHeader ? "contents" : "hidden"}>
        <Header />
      </div>
      {children}
      <div className={hasFooter(pathname) ? "" : "hidden"}>
        <Footer />
      </div>
      {showBottomNav && (
        <>
          {/* 고정된 하단 메뉴가 페이지 마지막 내용을 덮지 않도록 그 높이만큼 자리를 비워둔다 */}
          <div aria-hidden className="md:hidden h-[calc(4rem+env(safe-area-inset-bottom))] shrink-0" />
          <BottomNav />
        </>
      )}
    </>
  )
}
