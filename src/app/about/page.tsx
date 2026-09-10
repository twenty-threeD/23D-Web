import Link from "next/link";
import {
  IoArrowForwardOutline,
  IoChatbubbleEllipsesOutline,
  IoCheckmarkCircleOutline,
  IoLinkOutline,
  IoPeopleOutline,
  IoSearchOutline,
  IoShieldCheckmarkOutline,
} from "react-icons/io5";

const steps = [
  {
    number: "01",
    title: "필요한 능력을 찾습니다",
    description:
      "카테고리와 검색을 통해 지금 필요한 서비스와 능력자를 발견합니다.",
    icon: IoSearchOutline,
  },
  {
    number: "02",
    title: "대화로 조건을 맞춥니다",
    description:
      "채팅으로 작업 범위, 일정, 비용을 직접 확인하고 서로의 기대를 맞춥니다.",
    icon: IoChatbubbleEllipsesOutline,
  },
  {
    number: "03",
    title: "안심하고 거래합니다",
    description:
      "결제와 거래 기록을 바탕으로 약속한 서비스를 진행하고 결과를 남깁니다.",
    icon: IoCheckmarkCircleOutline,
  },
];

const features = [
  {
    title: "능력과 서비스의 발견",
    description:
      "이사·청소부터 외주, 과외, 자동차까지 다양한 카테고리에서 필요한 서비스를 찾을 수 있습니다.",
    icon: IoPeopleOutline,
  },
  {
    title: "프로필 기반의 신뢰",
    description:
      "서비스를 제공하는 사람의 프로필과 커리어를 확인하고 나에게 맞는 파트너를 선택할 수 있습니다.",
    icon: IoShieldCheckmarkOutline,
  },
  {
    title: "대화에서 결제까지",
    description:
      "문의와 협의는 채팅으로, 결제는 Toss Payments로 이어져 거래 과정을 한곳에서 관리합니다.",
    icon: IoChatbubbleEllipsesOutline,
  },
  {
    title: "블록체인 기반 검증",
    description:
      "결제 기록과 거래 정보를 블록체인과 연결해 활동을 더 투명하게 확인할 수 있도록 설계했습니다.",
    icon: IoLinkOutline,
  },
];

export default function Page() {
  return (
    <div className="flex min-h-full flex-col bg-white">
      <main className="flex-1 px-5 py-10 lg:px-20 lg:py-16">
        <div className="mx-auto w-full max-w-6xl">
          <section
            className="border-b border-zinc-200 py-8 lg:py-16"
            aria-labelledby="about-title"
          >
            <div className="max-w-3xl">
              <p className="pb-4 text-sm font-bold tracking-wide text-main">
                ABOUT ITDA
              </p>
              <h1
                id="about-title"
                className="text-4xl font-bold tracking-tight text-zinc-900 lg:text-6xl"
              >
                사람과 사람을
                <br />
                <span className="text-main">잇다.</span>
              </h1>
              <p className="max-w-2xl pt-6 text-base leading-8 text-zinc-600 lg:text-lg">
                잇다는 자신의 경험과 능력을 서비스로 나누는 사람과, 믿을 수 있는
                파트너가 필요한 사람을 연결하는 매칭 플랫폼입니다.
              </p>
              <div className="flex flex-wrap gap-3 pt-8">
                <Link
                  href="/search"
                  className="flex items-center gap-2 bg-main px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
                >
                  서비스 찾아보기
                  <IoArrowForwardOutline aria-hidden="true" />
                </Link>
                <Link
                  href="/docs"
                  className="flex items-center gap-2 border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-700 transition-colors hover:border-main hover:text-main"
                >
                  이용 안내 보기
                  <IoArrowForwardOutline aria-hidden="true" />
                </Link>
              </div>
            </div>
          </section>

          <section
            className="grid gap-10 border-b border-zinc-200 py-12 lg:grid-cols-[1fr_2fr] lg:gap-20 lg:py-20"
            aria-labelledby="why-title"
          >
            <div>
              <p className="pb-3 text-xs font-bold tracking-wide text-main">
                WHY ITDA
              </p>
              <h2
                id="why-title"
                className="text-2xl font-bold leading-tight text-zinc-900 lg:text-3xl"
              >
                좋은 연결은
                <br />
                신뢰에서 시작됩니다.
              </h2>
            </div>
            <div className="flex flex-col gap-5 text-sm leading-7 text-zinc-600 lg:text-base">
              <p>
                누군가에게는 분명한 실력과 경험이 있어도 그것을 필요한 사람에게
                알릴 기회가 부족합니다. 반대로 도움이 필요한 사람은 수많은 정보
                속에서 누구를 믿고 선택해야 할지 고민합니다.
              </p>
              <p>
                잇다는 이 간격을 줄이기 위해 만들어졌습니다. 능력자는 자신이
                잘하는 일을 소개하고, 이용자는 필요한 서비스를 비교하며, 두
                사람은 충분한 대화를 거쳐 함께 일을 시작합니다.
              </p>
            </div>
          </section>

          <section
            className="border-b border-zinc-200 py-12 lg:py-20"
            aria-labelledby="flow-title"
          >
            <div className="flex flex-col gap-3 pb-8 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="pb-3 text-xs font-bold tracking-wide text-main">
                  HOW IT WORKS
                </p>
                <h2
                  id="flow-title"
                  className="text-2xl font-bold text-zinc-900 lg:text-3xl"
                >
                  잇다에서 연결되는 방법
                </h2>
              </div>
              <p className="text-sm text-zinc-400">
                찾고, 대화하고, 거래합니다.
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <article
                    key={step.number}
                    className="flex min-h-56 flex-col border border-zinc-200 p-6"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-main">
                        {step.number}
                      </span>
                      <Icon
                        className="text-2xl text-zinc-400"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="flex flex-col gap-2 pt-12">
                      <h3 className="text-lg font-bold text-zinc-900">
                        {step.title}
                      </h3>
                      <p className="text-sm leading-6 text-zinc-500">
                        {step.description}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section
            className="border-b border-zinc-200 py-12 lg:py-20"
            aria-labelledby="feature-title"
          >
            <div className="pb-8">
              <p className="pb-3 text-xs font-bold tracking-wide text-main">
                WHAT WE BUILD
              </p>
              <h2
                id="feature-title"
                className="text-2xl font-bold text-zinc-900 lg:text-3xl"
              >
                잇다가 제공하는 경험
              </h2>
            </div>
            <div className="grid gap-x-12 gap-y-10 sm:grid-cols-2">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article key={feature.title} className="flex gap-4">
                    <Icon
                      className="shrink-0 pt-1 text-2xl text-main"
                      aria-hidden="true"
                    />
                    <div className="flex flex-col gap-2">
                      <h3 className="text-lg font-bold text-zinc-900">
                        {feature.title}
                      </h3>
                      <p className="text-sm leading-6 text-zinc-500">
                        {feature.description}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section
            className="flex flex-col gap-4 py-12 lg:flex-row lg:items-center lg:justify-between lg:py-16"
            aria-labelledby="next-title"
          >
            <div>
              <p className="pb-3 text-xs font-bold tracking-wide text-main">
                START WITH ITDA
              </p>
              <h2
                id="next-title"
                className="text-2xl font-bold text-zinc-900 lg:text-3xl"
              >
                나에게 필요한 연결을 시작해보세요.
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/search"
                className="flex items-center gap-2 bg-main px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
              >
                능력자 찾기
                <IoArrowForwardOutline aria-hidden="true" />
              </Link>
              <Link
                href="/team"
                className="flex items-center gap-2 border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-700 transition-colors hover:border-main hover:text-main"
              >
                팀원 소개
                <IoArrowForwardOutline aria-hidden="true" />
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
