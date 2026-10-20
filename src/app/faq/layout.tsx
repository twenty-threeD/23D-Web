import type { Metadata } from "next"
import { OPEN_GRAPH_BASE } from "@/src/lib/site"
import { FAQ_ITEMS } from "@/src/lib/faq"

// 화면(page.tsx)이 클라이언트 컴포넌트라 metadata 를 내보낼 수 없어, 같은 경로의 레이아웃에서 제목·설명을 붙인다
export const metadata: Metadata = {
  title: "자주 묻는 질문",
  description: "회원가입, 서비스 등록, 문의, 결제와 환불 등 잇다를 이용하면서 자주 묻는 질문을 모았습니다.",
  alternates: { canonical: "/faq" },
  openGraph: { ...OPEN_GRAPH_BASE, title: "자주 묻는 질문", description: "회원가입, 서비스 등록, 문의, 결제와 환불 등 잇다를 이용하면서 자주 묻는 질문을 모았습니다.", url: "/faq" },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  // 질문과 답을 구조화 데이터로 남겨, 검색 결과와 AI 답변에 잇다의 설명이 그대로 인용되게 한다.
  // 화면은 펼친 질문의 답만 그려서 HTML 에 모든 답이 들어 있지 않기 때문이기도 하다
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.email ? `${item.answer} (${item.email})` : item.answer },
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      {children}
    </>
  )
}
