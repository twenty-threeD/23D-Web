import type { Metadata } from "next"
import { OPEN_GRAPH_BASE } from "@/src/lib/site"

// 화면(page.tsx)이 클라이언트 컴포넌트라 metadata 를 내보낼 수 없어, 같은 경로의 레이아웃에서 제목·설명을 붙인다
export const metadata: Metadata = {
  title: "능력자 찾기",
  description: "분야와 정렬로 필요한 서비스를 좁히고 가격과 평점을 비교해 나에게 맞는 능력자를 찾으세요.",
  alternates: { canonical: "/search" },
  openGraph: { ...OPEN_GRAPH_BASE, title: "능력자 찾기", description: "분야와 정렬로 필요한 서비스를 좁히고 가격과 평점을 비교해 나에게 맞는 능력자를 찾으세요.", url: "/search" },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
