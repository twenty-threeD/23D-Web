import type { Metadata } from "next"
import { OPEN_GRAPH_BASE } from "@/src/lib/site"

// 화면(page.tsx)이 클라이언트 컴포넌트라 metadata 를 내보낼 수 없어, 같은 경로의 레이아웃에서 제목·설명을 붙인다
export const metadata: Metadata = {
  title: "블록체인이란",
  description: "블록체인의 개념과 특징, 잇다가 계약서와 결제 기록을 블록체인에 남겨 위변조를 막는 방법을 소개합니다.",
  alternates: { canonical: "/blockchain" },
  openGraph: { ...OPEN_GRAPH_BASE, title: "블록체인이란", description: "블록체인의 개념과 특징, 잇다가 계약서와 결제 기록을 블록체인에 남겨 위변조를 막는 방법을 소개합니다.", url: "/blockchain" },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
