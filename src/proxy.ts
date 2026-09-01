import { NextRequest, NextResponse } from 'next/server'

const PROTECTED = ['/chat']

export function proxy(req: NextRequest) {
  // 로그인 여부만 본다(값 검증은 하지 않는다 — 실제 인증은 API 서버가 한다).
  // hasSession: 프론트가 심는 마커 쿠키.
  // accessToken: 백엔드가 심는 httpOnly 쿠키. 쿠키 도메인이 프론트 오리진까지
  //   닿는 배포에서는 이쪽만 있을 수도 있어 함께 확인한다.
  const signedIn =
    req.cookies.has('hasSession') || req.cookies.has('accessToken')
  const isProtected = PROTECTED.some(
    (p) => req.nextUrl.pathname.startsWith(p)
  )

  if (isProtected && !signedIn) {
    return NextResponse.redirect(
      new URL('/login/signin', req.url)
    )
  }
}

export const config = {
  matcher: ['/chat/:path*'],
}