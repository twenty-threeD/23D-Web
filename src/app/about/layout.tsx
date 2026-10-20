import type { Metadata } from "next"
import { OPEN_GRAPH_BASE } from "@/src/lib/site"

// 화면(page.tsx)이 클라이언트 컴포넌트라 metadata 를 내보낼 수 없어, 같은 경로의 레이아웃에서 제목·설명을 붙인다
export const metadata: Metadata = {
  title: "프로젝트 소개",
  description: "필요한 능력을 찾고, 대화로 조건을 맞추고, 계약과 결제를 안전하게 남기는 잇다의 이용 흐름을 소개합니다.",
  alternates: { canonical: "/about" },
  openGraph: { ...OPEN_GRAPH_BASE, title: "프로젝트 소개", description: "필요한 능력을 찾고, 대화로 조건을 맞추고, 계약과 결제를 안전하게 남기는 잇다의 이용 흐름을 소개합니다.", url: "/about" },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
