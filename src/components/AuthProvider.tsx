'use client'

import { useEffect } from 'react'
import { useAuthStore, getTokenRemainingTime, setSessionCookie } from '@/src/store/authStore'
import { ensureAccessToken } from '@/src/lib/session'

// 만료 직전에 미리 갱신해 요청 도중 만료되는 것을 막는다
const REFRESH_MARGIN = 60 * 1000
const MAX_TIMEOUT = 2 ** 31 - 1

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.accessToken)
  const hasSession = useAuthStore((s) => s.hasSession)
  const hydrated = useAuthStore((s) => s.hydrated)

  // 세션 마커 쿠키를 동기화하고, 만료가 임박하면 재발급한다
  useEffect(() => {
    if (!hydrated || !hasSession) return

    setSessionCookie(true)

    const remaining = token ? getTokenRemainingTime(token) : null

    // 이미 만료됐거나 만료가 임박하면 즉시 재발급
    if (remaining === null || remaining <= REFRESH_MARGIN) {
      void ensureAccessToken()
      return
    }

    // setTimeout 상한(약 24.8일)을 넘으면 예약하지 않는다
    const delay = remaining - REFRESH_MARGIN
    if (delay > MAX_TIMEOUT) return

    const timer = setTimeout(() => void ensureAccessToken(), delay)
    return () => clearTimeout(timer)
  }, [hydrated, token, hasSession])

  // 백그라운드에 오래 둔 탭은 타이머가 밀릴 수 있으므로 복귀 시 다시 확인한다
  useEffect(() => {
    const onFocus = () => {
      if (useAuthStore.getState().hasSession) void ensureAccessToken()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  return <>{children}</>
}
