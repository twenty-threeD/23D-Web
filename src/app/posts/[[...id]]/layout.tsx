import type { Metadata } from "next"
import { OPEN_GRAPH_BASE } from "@/src/lib/site"
import { fetchFromApi, pageUrl, toAbsoluteFileUrl, toSummary } from "@/src/lib/seo"

interface CommunityPostSummary {
  id: number
  title: string
  content: string
  fileUrl?: string | null
  updatedAt?: string
}

interface Props {
  params: Promise<{ id?: string[] }>
  children: React.ReactNode
}

// 커뮤니티 글 화면도 클라이언트에서 그려져, 서버에서 글을 읽어 검색 결과·링크 미리보기용 제목·설명을 채운다.
// 작성자 아이디(이메일인 경우가 있다)는 넣지 않는다
export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { id } = await params
  const postId = Number(id?.[0])
  const post = Number.isInteger(postId) && postId > 0 ? await fetchFromApi<CommunityPostSummary>(`/api/community/post/${postId}`) : null
  if (!post) return { title: "커뮤니티", robots: { index: false } }

  const summary = toSummary(post.content || post.title)
  const image = toAbsoluteFileUrl(post.fileUrl)
  const url = pageUrl(`/posts/${post.id}`)

  return {
    title: post.title,
    description: summary,
    alternates: { canonical: url },
    openGraph: { ...OPEN_GRAPH_BASE, type: "article", url, title: post.title, description: summary, ...(image ? { images: [image] } : {}) },
  }
}

export default function Layout({ children }: Props) {
  return children
}
