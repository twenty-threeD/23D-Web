import Link from "next/link";
import {
  IoArrowForwardOutline,
  IoBookOutline,
  IoCubeOutline,
  IoDocumentTextOutline,
  IoEyeOutline,
  IoFingerPrintOutline,
  IoGitNetworkOutline,
  IoKeyOutline,
  IoLockClosedOutline,
  IoPeopleOutline,
  IoServerOutline,
  IoShieldCheckmarkOutline,
} from "react-icons/io5";
import { PAGE_PADDING } from "@/src/lib/layout";

// 비유보다 정의·특징·구성요소·동작·유형 순서로 이론을 먼저 세운다. 용어는 처음 나올 때 풀어서 쓴다
const features = [
  {
    title: "탈중앙화",
    description:
      "은행이나 서버 한 곳이 데이터를 독점하지 않고, 네트워크에 참여한 여러 컴퓨터(노드)가 같은 데이터를 나눠 보관합니다. 한 곳이 멈춰도 전체는 계속 동작합니다.",
    icon: IoGitNetworkOutline,
  },
  {
    title: "불변성",
    description:
      "한 번 기록된 데이터는 바꾸거나 지울 수 없습니다. 잘못된 기록이 있으면 기존 기록을 고치는 대신, 바로잡는 새 기록을 추가합니다.",
    icon: IoLockClosedOutline,
  },
  {
    title: "투명성",
    description:
      "참여자는 같은 원장(장부)을 공유하므로 언제 어떤 기록이 추가됐는지 누구나 확인하고 검증할 수 있습니다.",
    icon: IoEyeOutline,
  },
  {
    title: "합의",
    description:
      "새 기록은 참여자들이 정해진 규칙(합의 알고리즘)에 따라 '올바르다'고 동의해야만 장부에 추가됩니다.",
    icon: IoPeopleOutline,
  },
];

const components = [
  {
    title: "블록",
    description:
      "일정 기간 동안 발생한 거래 데이터를 묶은 단위입니다. 각 블록에는 데이터, 자신의 해시, 이전 블록의 해시가 들어 있습니다.",
    icon: IoCubeOutline,
  },
  {
    title: "해시",
    description:
      "어떤 데이터든 고정된 길이의 문자열로 바꾼 값으로, 데이터의 '디지털 지문'입니다. 원본이 조금만 달라져도 전혀 다른 값이 나옵니다.",
    icon: IoFingerPrintOutline,
  },
  {
    title: "노드",
    description:
      "블록체인 네트워크에 참여해 원장 사본을 보관하고 새 블록을 검증하는 컴퓨터입니다.",
    icon: IoServerOutline,
  },
  {
    title: "분산 원장",
    description:
      "모든 노드가 함께 보관하고 갱신하는 하나의 공유 장부입니다. 어느 한 사본만 바꾸면 다른 사본과 달라져 바로 드러납니다.",
    icon: IoBookOutline,
  },
  {
    title: "합의 알고리즘",
    description:
      "누가 새 블록을 추가할지, 어떤 기록이 맞는지를 정하는 규칙입니다. 작업 증명(PoW), 지분 증명(PoS) 등이 대표적입니다.",
    icon: IoShieldCheckmarkOutline,
  },
  {
    title: "스마트 계약",
    description:
      "정해진 조건이 충족되면 자동으로 실행되는 프로그램입니다. 중개자 없이 약속된 내용을 그대로 이행하게 합니다.",
    icon: IoKeyOutline,
  },
];

const process = [
  {
    number: "01",
    title: "거래 발생",
    description: "누군가 거래나 기록을 요청합니다.",
  },
  {
    number: "02",
    title: "네트워크에 전파",
    description: "요청이 여러 노드에 전달됩니다.",
  },
  {
    number: "03",
    title: "검증과 합의",
    description: "노드들이 규칙에 따라 거래가 유효한지 확인하고 합의합니다.",
  },
  {
    number: "04",
    title: "블록 생성",
    description: "검증된 거래들이 새 블록으로 묶이고 해시가 계산됩니다.",
  },
  {
    number: "05",
    title: "체인에 연결",
    description:
      "새 블록이 이전 블록의 해시를 담아 체인 끝에 붙고, 모든 노드의 원장이 갱신됩니다.",
  },
];

const uses = [
  {
    number: "01",
    title: "계약서 체결 후,",
    description:
      "갑과 을이 채팅에서 계약서에 모두 동의하면, 그 계약서의 디지털 지문(해시)이 블록체인에 기록됩니다.",
    icon: IoDocumentTextOutline,
  },
  {
    number: "02",
    title: "결제 후,",
    description:
      "결제가 끝난 사실과 시각이 함께 기록됩니다. 언제 어떤 거래가 이루어졌는지 나중에도 확인할 수 있습니다.",
    icon: IoShieldCheckmarkOutline,
  },
  {
    number: "03",
    title: "누구나 쉽게,",
    description:
      "블록체인 검증 화면에서 최근 블록과 거래 기록을 직접 살펴보고, 기록이 실제로 남았는지 확인할 수 있습니다.",
    icon: IoPeopleOutline,
  },
];

export default function Page() {
  return (
    <div className="flex flex-1 flex-col bg-white">
      <main className={`flex-1 ${PAGE_PADDING}`}>
        <div className="w-full">
          <section
            className="border-b border-line pb-8 lg:pb-16"
            aria-labelledby="blockchain-title"
          >
            <div className="max-w-3xl">
              <h1
                id="blockchain-title"
                className="text-3xl font-semibold tracking-tight text-zinc-900 lg:text-4xl"
              >
                블록체인이란?
              </h1>
              <p className="max-w-2xl pt-6 text-base leading-8 text-zinc-600 lg:text-lg">
                블록체인은 여러 컴퓨터가 같은 거래 기록을 나눠 보관하고, 서로
                검증하며 함께 갱신하는 분산 원장 기술입니다. 기록은 블록 단위로
                묶여 시간 순서대로 사슬처럼 연결되기 때문에, 한 번 기록된
                내용은 몰래 바꿀 수 없습니다.
              </p>
              <div className="flex flex-wrap gap-3 pt-8">
                <Link
                  href="/blockchain/verify"
                  className="flex items-center gap-2 bg-main px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
                >
                  블록체인 기록 확인하기
                  <IoArrowForwardOutline aria-hidden="true" />
                </Link>
              </div>
            </div>
          </section>

          <section
            className="grid gap-10 border-b border-line py-12 lg:grid-cols-[1fr_2fr] lg:gap-20 lg:py-20"
            aria-labelledby="definition-title"
          >
            <h2
              id="definition-title"
              className="text-2xl font-bold leading-tight text-zinc-900 lg:text-3xl"
            >
              블록체인이란
            </h2>
            <div className="flex flex-col gap-5 text-sm leading-7 text-zinc-600 lg:text-base">
              <p>
                블록체인은 거래 기록을 안전하게 공유하기 위한{" "}
                <strong className="text-main">분산 원장 기술(DLT)</strong>
                입니다. 기존 시스템은 은행·기업 같은 중앙 기관이 장부를
                관리하고, 사람들은 그 기관을 믿어야만 거래할 수 있었습니다.
              </p>
              <p>
                블록체인은 이 장부를 네트워크 참여자 모두가 함께 보관하고
                검증합니다. 그래서 특정 기관을 믿지 않아도 기록 자체를 믿을 수
                있고, 위조·이중 지불·데이터 조작 같은 문제를 기술적으로
                막습니다.
              </p>
              <p>
                2008년 비트코인과 함께 처음 등장했고, 지금은 금융뿐 아니라 계약,
                물류, 의료, 공공 기록처럼 &lsquo;기록의 신뢰&rsquo;가 중요한 여러
                분야에서 쓰이고 있습니다.
              </p>
            </div>
          </section>

          <section
            className="flex flex-col gap-8 border-b border-line py-12 lg:py-20"
            aria-labelledby="features-title"
          >
            <h2
              id="features-title"
              className="text-2xl font-bold text-zinc-900 lg:text-3xl"
            >
              블록체인의 주요 특징
            </h2>
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
            className="flex flex-col gap-8 border-b border-line py-12 lg:py-20"
            aria-labelledby="components-title"
          >
            <h2
              id="components-title"
              className="text-2xl font-bold text-zinc-900 lg:text-3xl"
            >
              블록체인을 이루는 요소
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {components.map((item) => {
                const Icon = item.icon;
                return (
                  <article
                    key={item.title}
                    className="flex flex-col gap-6 border border-line p-6"
                  >
                    <Icon className="text-2xl text-main" aria-hidden="true" />
                    <div className="flex flex-col gap-2">
                      <h3 className="text-lg font-bold text-zinc-900">
                        {item.title}
                      </h3>
                      <p className="text-sm leading-6 text-zinc-500">
                        {item.description}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section
            className="flex flex-col gap-8 border-b border-line py-12 lg:py-20"
            aria-labelledby="process-title"
          >
            <h2
              id="process-title"
              className="text-2xl font-bold text-zinc-900 lg:text-3xl"
            >
              블록체인은 어떻게 작동하나요?
            </h2>
            <ol className="grid gap-4 lg:grid-cols-5">
              {process.map((step) => (
                <li
                  key={step.number}
                  className="flex flex-col gap-3 border border-line p-6"
                >
                  <span className="text-sm font-bold text-main">
                    {step.number}
                  </span>
                  <h3 className="text-lg font-bold text-zinc-900">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-6 text-zinc-500">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
            <p className="text-sm leading-7 text-zinc-600">
              각 블록은 이전 블록의 해시를 품고 있어서, 중간 블록 하나를
              고치면 그 블록의 해시가 바뀌고 뒤에 이어진 모든 블록과의 연결이
              끊어집니다. 이것이 블록체인 기록을 사실상 위조할 수 없는
              이유입니다.
            </p>
          </section>

          <section
            className="flex flex-col gap-8 py-12 lg:py-20"
            aria-labelledby="uses-title"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <h2
                id="uses-title"
                className="text-2xl font-bold text-zinc-900 lg:text-3xl"
              >
                잇다는 이렇게 사용합니다
              </h2>
              <p className="text-sm text-zinc-400">
                계약과 결제의 약속을 지워지지 않게 남깁니다.
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {uses.map((step) => {
                const Icon = step.icon;
                return (
                  <article
                    key={step.number}
                    className="flex min-h-56 flex-col border border-line p-6"
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

        </div>
      </main>
    </div>
  );
}
