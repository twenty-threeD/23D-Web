"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore, setSessionCookie } from "@/src/store/authStore"

// 이미 로그인된 사용자를 랜딩/로그인 화면에 머무르지 않게 돌려보낸다.
//
// 미들웨어(proxy.ts)는 클라이언트가 심는 hasSession 쿠키만 보고 판단하는데,
// /chat 으로 곧장 들어오면 클라이언트 JS 가 돌기 전에 서버에서 먼저 판정한다.
// 그래서 세션이 살아 있어도 쿠키가 아직 없으면 로그인 화면으로 튕긴다.
// 이 훅이 그때 원래 가려던 곳(redirect 파라미터)으로 되돌려보낸다.
export function useRedirectIfAuthed(fallback = "/main") {
  const router = useRouter()
  const hydrated = useAuthStore((s) => s.hydrated)
  const hasSession = useAuthStore((s) => s.hasSession)

  useEffect(() => {
    // 스토어 복원 전에는 판단하지 않는다. 안 그러면 로그인 상태인데도 한 번 깜빡인다.
    if (!hydrated || !hasSession) return

    // 되돌려보내기 전에 쿠키를 다시 심는다.
    // 이게 없으면 미들웨어가 또 튕겨서 무한 왕복이 될 수 있다.
    setSessionCookie(true)

    const target = new URLSearchParams(window.location.search).get("redirect")
    // 외부 도메인으로 넘어가지 않도록 앱 내부 경로만 허용한다 (//evil.com 차단)
    const safe = target && target.startsWith("/") && !target.startsWith("//") ? target : fallback
    router.replace(safe)
  }, [hydrated, hasSession, router, fallback])
}
