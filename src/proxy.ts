import { NextRequest, NextResponse } from 'next/server'

const PROTECTED = ['/chat']

export function proxy(req: NextRequest) {
  const rt = req.cookies.get('accessToken')
  const isProtected = PROTECTED.some(
    (p) => req.nextUrl.pathname.startsWith(p)
  )

  if (isProtected && !rt) {
    return NextResponse.redirect(
      new URL('/login/signin', req.url)
    )
  }
}

export const config = {
  matcher: ['/chat/:path*'],
}