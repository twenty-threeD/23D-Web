import type { Metadata } from "next"
import { OPEN_GRAPH_BASE } from "@/src/lib/site"

// 화면(page.tsx)이 클라이언트 컴포넌트라 metadata 를 내보낼 수 없어, 같은 경로의 레이아웃에서 제목·설명을 붙인다
export const metadata: Metadata = {
  title: "커뮤니티",
  description: "견적이 적당한지, 어떤 능력자가 좋은지 먼저 겪어 본 이웃에게 묻고 답하는 잇다 커뮤니티입니다.",
  alternates: { canonical: "/community" },
  openGraph: { ...OPEN_GRAPH_BASE, title: "커뮤니티", description: "견적이 적당한지, 어떤 능력자가 좋은지 먼저 겪어 본 이웃에게 묻고 답하는 잇다 커뮤니티입니다.", url: "/community" },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
