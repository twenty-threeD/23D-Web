import Link from "next/link";
import {
  IoArrowForwardOutline,
  IoChatbubbleEllipsesOutline,
  IoDocumentTextOutline,
  IoHelpCircleOutline,
  IoSearchOutline,
} from "react-icons/io5";
import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";

const guideItems = [
  {
    icon: IoSearchOutline,
    eyebrow: "EXPLORE",
    title: "능력자와 서비스 찾기",
    description: "카테고리와 검색을 이용해 원하는 서비스를 찾아보세요.",
    href: "/search",
    linkLabel: "서비스 찾아보기",
  },
  {
    icon: IoDocumentTextOutline,
    eyebrow: "OFFER",
    title: "나의 서비스 등록하기",
    description:
      "내가 가진 경험과 능력을 서비스로 소개하고 새로운 의뢰를 만나보세요.",
    href: "/upload",
    linkLabel: "서비스 등록하기",
  },
  {
    icon: IoChatbubbleEllipsesOutline,
    eyebrow: "CONNECT",
    title: "문의하고 거래하기",
    description:
      "채팅으로 작업 범위와 일정을 협의한 뒤 안전하게 거래를 진행하세요.",
    href: "/chat",
    linkLabel: "채팅으로 이동",
  },
];

const policyItems = [
  {
    title: "자주 묻는 질문",
    description: "서비스 이용 중 궁금한 점을 확인하세요.",
    href: "/faq",
  },
  {
    title: "개인정보처리방침",
    description: "개인정보의 이용과 보호 기준을 안내합니다.",
    href: "/privateinfo",
  },
  {
    title: "이용약관",
    description: "서비스 이용에 필요한 권리와 의무를 확인하세요.",
    href: "/eula",
  },
];

export default function Page() {
  return (
    <div className="flex min-h-full flex-col bg-white">
      <Header />
      <main className="flex-1 px-5 py-10 lg:px-20 lg:py-16">
        <div className="mx-auto w-full max-w-6xl">
          <header className="border-b border-zinc-200 py-8 lg:py-10">
            <p className="pb-3 text-sm font-bold tracking-wide text-main">
              ITDA DOCS
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 lg:text-4xl">
              문서
            </h1>
            <p className="max-w-2xl pt-4 text-sm leading-6 text-zinc-500 lg:text-base">
              잇다를 처음 이용하는 분부터 서비스를 등록하는 분까지, 필요한
              내용을 한곳에서 확인하세요.
            </p>
          </header>

          <section className="py-10 lg:py-14" aria-labelledby="guide-heading">
            <div className="flex items-end justify-between gap-4 pb-5">
              <div>
                <p className="pb-2 text-xs font-bold tracking-wide text-main">
                  GET STARTED
                </p>
                <h2
                  id="guide-heading"
                  className="text-xl font-bold text-zinc-900 lg:text-2xl"
                >
                  잇다 이용 가이드
                </h2>
              </div>
              <span className="hidden text-sm text-zinc-400 sm:block">
                3 steps
              </span>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {guideItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="group flex min-h-56 flex-col justify-between border border-zinc-200 p-6 transition-colors hover:border-main hover:bg-main/5"
                  >
                    <div>
                      <Icon className="text-2xl text-main" aria-hidden="true" />
                      <p className="pt-5 text-xs font-bold tracking-wide text-zinc-400">
                        {item.eyebrow}
                      </p>
                      <h3 className="pt-2 text-lg font-bold text-zinc-900">
                        {item.title}
                      </h3>
                      <p className="pt-2 text-sm leading-6 text-zinc-500">
                        {item.description}
                      </p>
                    </div>
                    <span className="flex items-center gap-1 pt-6 text-sm font-semibold text-main">
                      {item.linkLabel}
                      <IoArrowForwardOutline
                        className="transition-transform group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          <section
            className="border-t border-zinc-200 py-10 lg:py-14"
            aria-labelledby="policy-heading"
          >
            <div className="pb-5">
              <p className="pb-2 text-xs font-bold tracking-wide text-main">
                REFERENCE
              </p>
              <h2
                id="policy-heading"
                className="text-xl font-bold text-zinc-900 lg:text-2xl"
              >
                도움말 및 정책
              </h2>
            </div>
            <div className="divide-y divide-zinc-200 border-y border-zinc-200">
              {policyItems.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group flex items-center justify-between gap-4 px-2 py-5 transition-colors hover:bg-zinc-50 sm:px-4"
                >
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-800 group-hover:text-main">
                      {item.title}
                    </h3>
                    <p className="pt-1 text-sm text-zinc-500">
                      {item.description}
                    </p>
                  </div>
                  <IoArrowForwardOutline
                    className="shrink-0 text-lg text-zinc-400 transition-transform group-hover:translate-x-1 group-hover:text-main"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
