import type { MetadataRoute } from "next"
import { SITE_URL } from "@/src/lib/site"

// 로그인해야 쓰는 화면(채팅·결제·프로필·글쓰기)과 내부 경로는 검색 결과에 나올 이유가 없어 막는다.
// AI 검색이 잇다를 인용할 수 있도록 AI 크롤러도 일반 검색엔진과 똑같이 허용한다
const PRIVATE_PATHS = [
  "/api/",
  "/dev-api-proxy/",
  "/chat",
  "/pay",
  "/profile",
  "/upload",
  "/community/write",
  "/login",
  "/oauth",
]

const AI_CRAWLERS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "PerplexityBot", "Google-Extended", "Yeti"]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: AI_CRAWLERS, allow: "/", disallow: PRIVATE_PATHS },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
