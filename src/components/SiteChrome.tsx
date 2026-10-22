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
  const showFooter = hasFooter(pathname)

  return (
    <>
      {/* 래퍼가 박스를 만들면 Header의 sticky가 이 div 높이 안에 갇혀 스크롤 시 사라진다 */}
      <div className={showHeader ? "contents" : "hidden"}>
        <Header />
      </div>
      {/* 내용이 짧은 페이지(404·로그인 실패 등)에서 푸터가 첫 화면에 올라오고 그 아래가 비어 보여서,
          헤더 + 본문이 첫 화면을 꽉 채우게 하고 푸터는 스크롤해야 보이게 한다.
          헤더까지 감싸면 sticky 가 이 박스 안에 갇혀 푸터 근처에서 헤더가 밀려 올라가므로 본문만 감싸고 헤더 높이(60px)를 뺀다.
          휴대폰은 고정 하단 메뉴가 화면 아래를 덮으니 그 높이도 뺀다. 주소창이 접힐 때마다 높이가 출렁이지 않게 svh 를 쓴다.
          푸터가 없는 화면(채팅 등)은 원래대로 body 의 flex 에 바로 참여하도록 contents 로 둔다 */}
      <div
        className={
          !showFooter
            ? "contents"
            : !showHeader
              ? "flex flex-1 flex-col min-h-svh"
              : showBottomNav
                ? "flex flex-1 flex-col min-h-[calc(100svh-60px-4rem-env(safe-area-inset-bottom))] md:min-h-[calc(100svh-60px)]"
                : "flex flex-1 flex-col min-h-[calc(100svh-60px)]"
        }
      >
        {children}
      </div>
      <div className={showFooter ? "" : "hidden"}>
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
