import { NextRequest } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.idta.store'

// 로컬 개발 전용 /api 프록시. next.config 의 개발 모드 rewrite 가 여기로 보낸다.
// 백엔드는 쿠키를 Domain=.idta.store 로 심는데, 브라우저는 localhost 에서 이 쿠키를 버린다.
// rewrites 는 응답 헤더를 고칠 수 없어서, 직접 프록시하면서 Set-Cookie 의 Domain 만 걷어내 localhost 쿠키로 만든다.
// 배포(idta.store)에서는 원래 도메인 그대로 써야 하므로 기존 rewrite 를 그대로 타고 이 핸들러는 쓰이지 않는다.

// 요청·응답을 그대로 넘기면 안 되는 헤더. fetch 가 압축을 풀어 주므로 길이·인코딩 헤더는 원본과 어긋난다
const HOP_BY_HOP = ['host', 'connection', 'content-length', 'content-encoding', 'transfer-encoding', 'keep-alive']

function stripCookieDomain(cookie: string) {
  return cookie.replace(/;\s*Domain=[^;]*/i, '')
}

async function proxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  if (process.env.NODE_ENV !== 'development') {
    return new Response('Not Found', { status: 404 })
  }

  const { path } = await params
  const target = `${API_URL}/api/${path.join('/')}${req.nextUrl.search}`

  const headers = new Headers(req.headers)
  HOP_BY_HOP.forEach((h) => headers.delete(h))
  // 브라우저는 zstd 도 받는다고 보내는데 Node fetch 는 zstd 를 풀지 못한다.
  // 그대로 넘기면 Cloudflare 가 zstd 로 압축해 주고, 압축된 바이트가 그대로 브라우저로 가서 JSON 파싱이 깨진다
  headers.set('accept-encoding', 'gzip, deflate, br')

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
  const upstream = await fetch(target, {
    method: req.method,
    headers,
    body: hasBody ? req.body : undefined,
    // 스트림 바디를 보내려면 필요하다 (Node fetch 규약)
    ...(hasBody ? { duplex: 'half' } : {}),
    redirect: 'manual',
    // 알림 SSE 처럼 오래 열린 요청을 브라우저가 끊으면 백엔드 연결도 같이 끊는다
    signal: req.signal,
  } as RequestInit)

  const resHeaders = new Headers()
  upstream.headers.forEach((value, key) => {
    if (key === 'set-cookie' || HOP_BY_HOP.includes(key)) return
    resHeaders.set(key, value)
  })
  // Set-Cookie 는 여러 개가 올 수 있어 합치지 않고 하나씩 붙인다
  upstream.headers.getSetCookie().forEach((cookie) => {
    resHeaders.append('set-cookie', stripCookieDomain(cookie))
  })

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: resHeaders,
  })
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE }
