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

function setAuthCookie(token: string | null) {
  if (typeof document === 'undefined') return
  if (token) {
    document.cookie = `accessToken=${token}; path=/; SameSite=Lax`
  } else {
    document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  }
}

interface AuthStore {
  accessToken: string | null
  username: string | null
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
      hasSession: false,
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      setToken: (token) => {
        setAuthCookie(token)
        set({
          accessToken: token,
          username: decodeJwtUsername(token),
          hasSession: true,
        })
      },
      clear: () => {
        setAuthCookie(null)
        set({ accessToken: null, username: null, hasSession: false })
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
        hasSession: state.hasSession,
      }),
      // 만료된 액세스 토큰이라도 지우지 않는다.
      // 리프레시 쿠키로 살릴 수 있으므로 판단은 AuthProvider 에 맡긴다.
      // 이 콜백은 스토어 생성이 끝나기 전에 실행되므로
      // useAuthStore 를 참조하지 말고 전달받은 state 의 액션을 써야 한다
      onRehydrateStorage: () => (state) => {
        if (!state) return
        if (state.accessToken && !isTokenExpired(state.accessToken)) {
          setAuthCookie(state.accessToken)
        }
        state.setHydrated()
      },
    }
  )
)
