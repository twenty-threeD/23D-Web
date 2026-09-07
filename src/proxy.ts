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
    // 쿠키는 클라이언트가 심으므로, 세션이 살아 있는데도 여기서 먼저 걸릴 수 있다.
    // 원래 가려던 경로를 넘겨서 로그인 화면이 곧바로 되돌려보낼 수 있게 한다.
    const url = new URL('/login/signin', req.url)
    url.searchParams.set('redirect', req.nextUrl.pathname + req.nextUrl.search)
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: ['/chat/:path*'],
}