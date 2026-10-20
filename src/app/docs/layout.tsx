import type { Metadata } from "next"
import { OPEN_GRAPH_BASE } from "@/src/lib/site"

// 화면(page.tsx)이 클라이언트 컴포넌트라 metadata 를 내보낼 수 없어, 같은 경로의 레이아웃에서 제목·설명을 붙인다
export const metadata: Metadata = {
  title: "이용 가이드",
  description: "능력자와 서비스 찾기, 서비스 등록, 채팅·계약·결제까지 잇다 이용 방법을 안내합니다.",
  alternates: { canonical: "/docs" },
  openGraph: { ...OPEN_GRAPH_BASE, title: "이용 가이드", description: "능력자와 서비스 찾기, 서비스 등록, 채팅·계약·결제까지 잇다 이용 방법을 안내합니다.", url: "/docs" },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
