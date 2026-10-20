import type { Metadata } from "next"
import { OPEN_GRAPH_BASE } from "@/src/lib/site"

// 화면(page.tsx)이 클라이언트 컴포넌트라 metadata 를 내보낼 수 없어, 같은 경로의 레이아웃에서 제목·설명을 붙인다
export const metadata: Metadata = {
  title: "블록체인 검증",
  description: "잇다에서 이뤄진 결제·계약 기록이 블록체인에 그대로 남아 있는지 주문번호로 직접 확인하세요.",
  alternates: { canonical: "/blockchain/verify" },
  openGraph: { ...OPEN_GRAPH_BASE, title: "블록체인 검증", description: "잇다에서 이뤄진 결제·계약 기록이 블록체인에 그대로 남아 있는지 주문번호로 직접 확인하세요.", url: "/blockchain/verify" },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
