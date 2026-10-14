// 서버 응답을 브라우저 메모리에 잠시 들고 있는 캐시.
//
// 페이지마다 같은 데이터를 다시 받는 일이 잦다(카테고리·내 프로필·게시글 목록 등).
// 채팅처럼 방을 바꿀 때마다 페이지가 새로 마운트되는 화면은 컴포넌트 상태에 들고 있을 수 없어 모듈 단위로 둔다.
//
// - 같은 키를 동시에 여러 곳에서 요청하면 요청은 한 번만 나간다
// - 실패한 응답은 남기지 않는다(다음 호출에서 다시 시도)
// - 새로고침하면 사라진다. 오래 두면 안 되는 값은 TTL 을 짧게 잡고, 바꾸는 요청 뒤에는 invalidate 한다

type Entry = {
  value?: unknown
  hasValue: boolean
  expiresAt: number
  pending?: Promise<unknown>
}

const entries = new Map<string, Entry>()

export const MINUTE = 60_000

export function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = entries.get(key)
  if (hit?.pending) return hit.pending as Promise<T>
  if (hit?.hasValue && hit.expiresAt > Date.now()) return Promise.resolve(hit.value as T)

  const pending = load().then(
    (value) => {
      // 기다리는 사이 invalidate 로 지워졌다면 옛 응답이므로 채우지 않는다
      if (entries.get(key)?.pending === pending) {
        entries.set(key, { value, hasValue: true, expiresAt: Date.now() + ttlMs })
      }
      return value
    },
    (error) => {
      if (entries.get(key)?.pending === pending) entries.delete(key)
      throw error
    },
  )
  entries.set(key, { hasValue: false, expiresAt: 0, pending })
  return pending
}

// prefix 로 시작하는 키를 모두 지운다. 'post:' 처럼 묶음 단위로 지울 수 있게 키를 ':' 로 나눠 짓는다
export function invalidate(prefix: string) {
  for (const key of [...entries.keys()]) {
    if (key.startsWith(prefix)) entries.delete(key)
  }
}

// 로그아웃·다른 계정 로그인 때 이전 사람의 데이터가 남지 않게 전부 비운다
export function clearCache() {
  entries.clear()
}
