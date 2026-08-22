import { useAuthStore, isTokenExpired } from '@/src/store/authStore'
import { reissueToken } from '@/src/lib/auth'

// 동시에 여러 곳에서 재발급을 요청해도 실제 호출은 한 번만 나가도록 공유한다
let inflight: Promise<string | null> | null = null

// 유효한 액세스 토큰을 반환한다.
// 만료되었으면 리프레시 쿠키로 재발급하고, 재발급까지 실패하면 로그아웃 후 null 을 반환한다.
export async function ensureAccessToken(): Promise<string | null> {
  const { accessToken, hasSession, clear, setToken } = useAuthStore.getState()

  if (accessToken && !isTokenExpired(accessToken)) return accessToken
  if (!hasSession) return null

  if (!inflight) {
    inflight = reissueToken()
      .then((token) => {
        setToken(token)
        return token
      })
      .catch(() => {
        // 리프레시 토큰도 만료/폐기된 상태이므로 재로그인이 필요하다
        clear()
        return null
      })
      .finally(() => {
        inflight = null
      })
  }

  return inflight
}
