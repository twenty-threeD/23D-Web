import { API_ORIGIN, SITE_URL } from "@/src/lib/site"

// 화면(page.tsx)은 클라이언트에서 데이터를 불러와, 크롤러가 받는 HTML 에는 글 내용이 없다.
// 그래서 메타데이터를 만드는 서버 쪽에서 같은 API 를 한 번 더 읽는다
export async function fetchFromApi<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_ORIGIN}${path}`, { next: { revalidate: 600 } })
    if (!res.ok) return null
    const json = await res.json()
    return (json?.data ?? json) as T
  } catch {
    return null
  }
}

// 검색 결과 설명란에 맞게 줄바꿈·마크다운 이미지·태그를 걷어내고 자른다
export function toSummary(text: string, max = 150): string {
  const plain = text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[[^\]]*:[^\]]*\]/g, " ")
    .replace(/[#*>`_~-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  return plain.length > max ? `${plain.slice(0, max - 1)}…` : plain
}

// 백엔드가 주는 파일 경로(/files/…)를 검색엔진이 직접 받을 수 있는 절대 주소로 바꾼다
export function toAbsoluteFileUrl(url?: string | null): string | undefined {
  if (!url) return undefined
  if (/^https?:\/\//.test(url)) return url
  return `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`
}

export function pageUrl(path: string) {
  return `${SITE_URL}${path}`
}
