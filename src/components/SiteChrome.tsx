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
      <div className={showHeader ? "" : "hidden"}>
        <Header />
      </div>
      {children}
      <div className={hasFooter(pathname) ? "" : "hidden"}>
        <Footer />
      </div>
    </>
  )
}
