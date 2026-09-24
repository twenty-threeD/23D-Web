import { useEffect, useState } from "react"
import { useAuthStore } from "@/src/store/authStore"
import { getMyLocation, type MemberLocation } from "@/src/lib/community"

// 동네 주민 글 필터에 쓰는 내 지역. loaded 전에 목록을 거르면
// 같은 지역 글이 잠깐 빠졌다 나타나므로 호출부는 loaded 를 기다린다.
// 결과를 토큰과 함께 저장해, 토큰이 바뀌면 effect 안에서 초기화하지 않아도 자동으로 미로딩 상태가 된다.
export function useMyLocation() {
  const token = useAuthStore((s) => s.accessToken)
  const [result, setResult] = useState<{ token: string; location: MemberLocation | null } | null>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    getMyLocation(token)
      .catch(() => null)
      .then((location) => {
        if (!cancelled) setResult({ token, location })
      })
    return () => { cancelled = true }
  }, [token])

  if (!token) return { location: null, loaded: true }
  const loaded = result?.token === token
  return { location: loaded ? result.location : null, loaded }
}
