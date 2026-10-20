import type { Metadata } from "next"
import { OPEN_GRAPH_BASE } from "@/src/lib/site"

// 화면(page.tsx)이 클라이언트 컴포넌트라 metadata 를 내보낼 수 없어, 같은 경로의 레이아웃에서 제목·설명을 붙인다
export const metadata: Metadata = {
  title: "서비스 둘러보기",
  description: "광고, 이웃들이 많이 찾는 서비스, 재방문율이 높은 서비스를 한 화면에서 둘러보세요. 이사·청소, 설치·수리, 인테리어, 외주, 과외 등 분야별 능력자를 만날 수 있습니다.",
  alternates: { canonical: "/main" },
  openGraph: { ...OPEN_GRAPH_BASE, title: "서비스 둘러보기", description: "광고, 이웃들이 많이 찾는 서비스, 재방문율이 높은 서비스를 한 화면에서 둘러보세요. 이사·청소, 설치·수리, 인테리어, 외주, 과외 등 분야별 능력자를 만날 수 있습니다.", url: "/main" },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
