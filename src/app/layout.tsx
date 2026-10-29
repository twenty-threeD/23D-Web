import type { Metadata } from "next";
import { Toast } from "@/src/components/ui/toaster"
import localFont from "next/font/local";
import "./globals.css";
import AuthProvider from "@/src/components/AuthProvider";
import SiteChrome from "@/src/components/SiteChrome";
import CallProvider from "@/src/components/call/CallProvider";
import { OPEN_GRAPH_BASE, SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME, SITE_NAME_EN, SITE_TITLE, SITE_URL, SOCIAL_LINKS } from "@/src/lib/site";

// Pretendard 는 next/font/google 에 없어 가변 폰트 파일을 직접 두고 self-host 한다.
// 가변 폰트 한 파일로 시안의 모든 굵기(Medium 등)를 커버한다
const pretendard = localFont({
  src: "../../public/fonts/PretendardVariable.woff2",
  variable: "--font-pretendard-local",
  weight: "45 920",
  display: "swap",
});

// 사이트 소유 확인 코드는 서치 콘솔·서치어드바이저에서 발급받아 배포 환경 변수에 넣는다. 없으면 태그를 넣지 않는다
// 네이버 코드는 페이지 HTML 에 그대로 노출되는 공개값이라 비밀이 아니다. 배포 환경 변수 설정 없이도 소유확인이 유지되도록 기본값으로 둔다
const naverVerification = process.env.NAVER_SITE_VERIFICATION ?? "27142b65de1611acaa2d727b3f2adb10b2a1539e"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // 하위 페이지는 "페이지 제목 | 잇다" 로 붙는다
  title: { default: SITE_TITLE, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: SITE_NAME,
  openGraph: {
    ...OPEN_GRAPH_BASE,
    url: SITE_URL,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: { card: "summary_large_image", title: SITE_TITLE, description: SITE_DESCRIPTION },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    ...(naverVerification ? { other: { "naver-site-verification": naverVerification } } : {}),
  },
};

// 검색엔진·AI 검색이 사이트가 무엇인지, 어떻게 검색하는지 바로 알 수 있게 하는 구조화 데이터
const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      alternateName: SITE_NAME_EN,
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      description: SITE_DESCRIPTION,
      sameAs: SOCIAL_LINKS,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      alternateName: SITE_NAME_EN,
      url: SITE_URL,
      inLanguage: "ko-KR",
      publisher: { "@id": `${SITE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/search?keyword={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${pretendard.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          // 고정된 사이트 정보만 넣으므로 그대로 직렬화해도 안전하다
          dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
        />
        <AuthProvider>
          <SiteChrome>{children}</SiteChrome>
          {/* 걸려온 전화는 채팅방 밖에서도 받아야 해서 전역에 둔다 */}
          <CallProvider />
        </AuthProvider>
        <Toast />
      </body>
    </html>
  );
}
