"use client"

import { usePathname } from "next/navigation"
import Header from "@/src/components/Header"
import Footer from "@/src/components/Footer"

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
    </>
  )
}
