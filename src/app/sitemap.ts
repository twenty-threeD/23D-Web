import type { MetadataRoute } from "next"
import { API_ORIGIN, SITE_URL } from "@/src/lib/site"

// 한 시간마다 다시 만든다. 새 서비스·커뮤니티 글이 너무 늦지 않게 검색엔진에 알려진다
export const revalidate = 3600

const STATIC_PAGES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/main", priority: 0.9, changeFrequency: "daily" },
  { path: "/search", priority: 0.9, changeFrequency: "daily" },
  { path: "/community", priority: 0.8, changeFrequency: "daily" },
  { path: "/blockchain", priority: 0.6, changeFrequency: "monthly" },
  { path: "/blockchain/verify", priority: 0.6, changeFrequency: "daily" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.6, changeFrequency: "monthly" },
  { path: "/notice", priority: 0.5, changeFrequency: "weekly" },
  { path: "/docs", priority: 0.4, changeFrequency: "monthly" },
  { path: "/team", priority: 0.3, changeFrequency: "yearly" },
  { path: "/privateinfo", priority: 0.2, changeFrequency: "yearly" },
  { path: "/eula", priority: 0.2, changeFrequency: "yearly" },
]

interface ListItem {
  id: number
  updatedAt?: string
}

// 목록 API 를 끝 페이지까지 읽는다. 백엔드가 응답하지 않아도 sitemap 자체는 고정 페이지로 만들어져야 해서 실패는 빈 목록으로 넘긴다
async function fetchAll(path: string): Promise<ListItem[]> {
  const items: ListItem[] = []
  try {
    for (let page = 0; page < 50; page++) {
      const res = await fetch(`${API_ORIGIN}${path}?page=${page}&size=100`, { next: { revalidate } })
      if (!res.ok) break
      const json = await res.json()
      const data = json?.data ?? json
      items.push(...(data?.content ?? []))
      if (data?.last !== false) break
    }
  } catch {
    // 위 주석 참고
  }
  return items
}

const lastModified = (value?: string) => {
  const date = value ? new Date(value) : null
  return date && !Number.isNaN(date.getTime()) ? date : undefined
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, communityPosts] = await Promise.all([fetchAll("/api/post"), fetchAll("/api/community/post")])

  return [
    ...STATIC_PAGES.map(({ path, priority, changeFrequency }) => ({
      url: `${SITE_URL}${path === "/" ? "" : path}`,
      changeFrequency,
      priority,
    })),
    ...services.map((post) => ({
      url: `${SITE_URL}/item/${post.id}`,
      lastModified: lastModified(post.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...communityPosts.map((post) => ({
      url: `${SITE_URL}/posts/${post.id}`,
      lastModified: lastModified(post.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ]
}
