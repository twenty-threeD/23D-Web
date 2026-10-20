import type { Metadata } from "next"
import { OPEN_GRAPH_BASE } from "@/src/lib/site"

// 화면(page.tsx)이 클라이언트 컴포넌트라 metadata 를 내보낼 수 없어, 같은 경로의 레이아웃에서 제목·설명을 붙인다
export const metadata: Metadata = {
  title: "팀원 소개",
  description: "잇다를 만든 23D 팀을 소개합니다.",
  alternates: { canonical: "/team" },
  openGraph: { ...OPEN_GRAPH_BASE, title: "팀원 소개", description: "잇다를 만든 23D 팀을 소개합니다.", url: "/team" },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
