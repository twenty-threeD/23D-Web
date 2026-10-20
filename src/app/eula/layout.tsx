import type { Metadata } from "next"
import { OPEN_GRAPH_BASE } from "@/src/lib/site"

// 화면(page.tsx)이 클라이언트 컴포넌트라 metadata 를 내보낼 수 없어, 같은 경로의 레이아웃에서 제목·설명을 붙인다
export const metadata: Metadata = {
  title: "이용약관",
  description: "잇다 서비스 이용약관입니다.",
  alternates: { canonical: "/eula" },
  openGraph: { ...OPEN_GRAPH_BASE, title: "이용약관", description: "잇다 서비스 이용약관입니다.", url: "/eula" },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
