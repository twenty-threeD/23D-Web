import { create } from 'zustand'
import { persist } from 'zustand/middleware'

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return null
  }
}

function decodeJwtUsername(token: string): string | null {
  const payload = decodeJwtPayload(token)
  if (!payload) return null
  return (payload.username as string) ?? (payload.sub as string) ?? null
}

function decodeJwtRole(token: string): string | null {
  const role = decodeJwtPayload(token)?.role
  return typeof role === 'string' ? role.replace(/^ROLE_/, '') : null
}

// 토큰 만료 여부 (exp 가 없으면 만료되지 않은 것으로 간주)
export function isTokenExpired(token: string): boolean {
  const exp = decodeJwtPayload(token)?.exp
  if (typeof exp !== 'number') return false
  return exp * 1000 <= Date.now()
}

// 토큰 만료까지 남은 시간(ms). 만료되었거나 알 수 없으면 null
export function getTokenRemainingTime(token: string): number | null {
  const exp = decodeJwtPayload(token)?.exp
  if (typeof exp !== 'number') return null
  const remaining = exp * 1000 - Date.now()
  return remaining > 0 ? remaining : null
}

// 미들웨어는 로그인 여부만 확인하므로(proxy.ts) 토큰 값을 쿠키에 복사할 이유가 없다.
// 예전에는 accessToken 이라는 이름으로 심었는데, 백엔드가 심는 httpOnly 쿠키와 이름이 겹쳐
// 스코프가 다른 동명 쿠키가 2개씩 쌓였다. 값 없는 마커 쿠키로 분리한다.
const SESSION_COOKIE = 'hasSession'
const EXPIRED = 'Thu, 01 Jan 1970 00:00:00 GMT'

// Max-Age 를 주지 않으면 브라우저를 닫을 때 사라지는 세션 쿠키가 된다.
// 그러면 로그인 상태는 localStorage 에 남아 있는데 마커 쿠키만 없어져서,
// 브라우저를 다시 연 뒤 /chat 으로 바로 들어갈 때 proxy 가 비로그인으로 보고
// 로그인 화면으로 튕긴다(클라이언트가 쿠키를 다시 심기 전에 서버에서 판정한다).
// 리프레시 토큰보다 넉넉하게 잡아둔다. 리프레시가 먼저 죽으면
// ensureAccessToken 이 clear() 로 이 쿠키까지 걷어내므로 남아도 문제되지 않는다.
const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 30
const WS_COOKIE_PATH = '/ws-stomp'

export function setSessionCookie(active: boolean) {
  if (typeof document === 'undefined') return
  document.cookie = active
    ? `${SESSION_COOKIE}=1; path=/; Max-Age=${SESSION_COOKIE_MAX_AGE}; SameSite=Lax`
    : `${SESSION_COOKIE}=; path=/; expires=${EXPIRED}`
  // 예전 버전이 path=/ 로 심어둔 accessToken 쿠키를 걷어낸다.
  // 백엔드의 httpOnly 쿠키는 JS로 지울 수 없으므로 여기서 지워지는 건 프론트가 만든 것뿐이다.
  document.cookie = `accessToken=; path=/; expires=${EXPIRED}`
}

// 채팅 웹소켓(SockJS) 전용 인증 쿠키.
//
// 백엔드가 /ws-stomp 의 ?token= 쿼리 인증을 막으면서 헤더 또는 쿠키만 받는데,
// 브라우저 SockJS 는 핸드셰이크(/ws-stomp/info)에 커스텀 헤더를 실을 수 없다.
// 남는 수단이 쿠키뿐이라 액세스 토큰을 쿠키로 넘긴다.
//
// path 를 /ws-stomp 로 좁히는 게 핵심이다. 이러면 이 쿠키는 웹소켓 요청에만 실려서,
// /api/* 호출에서 백엔드의 동명 httpOnly 쿠키와 겹치지 않는다.
// (예전에 path=/ 로 심었다가 동명 쿠키가 2개씩 쌓였던 문제를 피한다.)
export function setWsAuthCookie(token: string | null) {
  if (typeof document === 'undefined') return
  document.cookie = token
    ? `accessToken=${token}; path=${WS_COOKIE_PATH}; SameSite=Lax`
    : `accessToken=; path=${WS_COOKIE_PATH}; expires=${EXPIRED}`
}

interface AuthStore {
  accessToken: string | null
  username: string | null
  role: string | null
  // 리프레시 토큰은 httpOnly 쿠키라 읽을 수 없으므로,
  // 재발급을 시도해볼 만한 상태인지만 기록해둔다
  hasSession: boolean
  hydrated: boolean
  setHydrated: () => void
  setToken: (token: string) => void
  clear: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      accessToken: null,
      username: null,
      role: null,
      hasSession: false,
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      setToken: (token) => {
        setSessionCookie(true)
        setWsAuthCookie(token)
        set({
          accessToken: token,
          username: decodeJwtUsername(token),
          role: decodeJwtRole(token),
          hasSession: true,
        })
      },
      clear: () => {
        setSessionCookie(false)
        setWsAuthCookie(null)
        set({ accessToken: null, username: null, role: null, hasSession: false })
      },
    }),
    {
      name: 'auth-storage',
      version: 1,
      // hasSession 도입 이전에 로그인한 사용자도 자동 재발급 대상에 포함시킨다
      migrate: (persisted) => {
        const state = persisted as Partial<AuthStore> | undefined
        return { ...state, hasSession: !!state?.accessToken } as AuthStore
      },
      partialize: (state) => ({
        accessToken: state.accessToken,
        username: state.username,
        role: state.role,
        hasSession: state.hasSession,
      }),
      // 만료된 액세스 토큰이라도 지우지 않는다.
      // 리프레시 쿠키로 살릴 수 있으므로 판단은 AuthProvider 에 맡긴다.
      // 이 콜백은 스토어 생성이 끝나기 전에 실행되므로
      // useAuthStore 를 참조하지 말고 전달받은 state 의 액션을 써야 한다
      onRehydrateStorage: () => (state) => {
        if (!state) return
        // 액세스 토큰이 만료됐어도 리프레시 쿠키로 살릴 수 있으므로 세션이 있으면 마커를 유지한다.
        // (예전에는 만료 시 쿠키를 안 심어서, 재발급 가능한 사용자가 하드 로드 때 로그인으로 튕겼다)
        if (state.hasSession) setSessionCookie(true)
        // 새로고침 직후에도 웹소켓이 붙어야 하므로 저장된 토큰을 쿠키에 되살린다
        if (state.accessToken) setWsAuthCookie(state.accessToken)
        state.setHydrated()
      },
    }
  )
)
