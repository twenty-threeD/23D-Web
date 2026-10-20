import type { Metadata } from "next"
import { OPEN_GRAPH_BASE } from "@/src/lib/site"
import type { Post } from "@/src/lib/post"
import { parsePostContent } from "@/src/types/priceCard"
import { fetchFromApi, pageUrl, toAbsoluteFileUrl, toSummary } from "@/src/lib/seo"

interface Props {
  params: Promise<{ id?: string[] }>
  children: React.ReactNode
}

async function loadPost(params: Props["params"]) {
  const { id } = await params
  const postId = Number(id?.[0])
  if (!Number.isInteger(postId) || postId <= 0) return null
  return fetchFromApi<Post>(`/api/post/${postId}`)
}

// 서비스 상세 화면은 클라이언트에서 그려져 크롤러가 받는 HTML 에 제목·설명이 없다.
// 서버에서 같은 글을 읽어 검색 결과·링크 미리보기에 쓸 제목·설명·대표 이미지를 채운다
export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const post = await loadPost(params)
  if (!post) return { title: "서비스", robots: { index: false } }

  const { description } = parsePostContent(post.content)
  const summary = toSummary(description || post.title)
  // 화면과 같은 규칙으로 대표 이미지를 고른다 (헤더 이미지가 있으면 두 번째가 메인 이미지)
  const image = toAbsoluteFileUrl(post.fileUrls?.[1] ?? post.fileUrls?.[0])
  const url = pageUrl(`/item/${post.id}`)

  return {
    title: post.title,
    description: summary,
    alternates: { canonical: url },
    openGraph: { ...OPEN_GRAPH_BASE, url, title: post.title, description: summary, ...(image ? { images: [image] } : {}) },
    twitter: { card: image ? "summary_large_image" : "summary", title: post.title, description: summary, ...(image ? { images: [image] } : {}) },
  }
}

export default async function Layout({ params, children }: Props) {
  const post = await loadPost(params)
  if (!post) return children

  const { description, plans } = parsePostContent(post.content)
  const prices = plans.map((plan) => Number(String(plan.price).replace(/[^0-9]/g, ""))).filter((price) => price > 0)
  // AI 검색·구글이 "어떤 서비스를 얼마에 하는지" 바로 읽을 수 있게 서비스 정보를 구조화 데이터로 남긴다.
  // 판매자 실명은 넣지 않는다
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: post.title,
    description: toSummary(description || post.title, 500),
    url: pageUrl(`/item/${post.id}`),
    ...(post.category?.name ? { serviceType: post.category.name, category: post.category.fullName ?? post.category.name } : {}),
    ...(post.fileUrls?.length ? { image: post.fileUrls.map(toAbsoluteFileUrl) } : {}),
    areaServed: { "@type": "Country", name: "대한민국" },
    ...(prices.length
      ? {
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: "KRW",
            lowPrice: Math.min(...prices),
            highPrice: Math.max(...prices),
            offerCount: prices.length,
          },
        }
      : {}),
    // 잇다는 서비스를 직접 하지 않고 이어 주는 쪽이라 provider 가 아닌 broker 로 둔다
    broker: { "@id": `${pageUrl("")}/#organization` },
  }

  return (
    <>
      {/* 글 제목·본문은 사용자가 쓴 값이라 "</script>" 같은 문자열로 태그를 빠져나오지 못하게 < 를 이스케이프한다 */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      {children}
    </>
  )
}
