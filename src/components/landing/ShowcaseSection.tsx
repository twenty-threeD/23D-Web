"use client"

import { useRef, useState, type ReactNode } from "react"
import Image from "next/image"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import { ChatMock, PaymentMock } from "./mocks"

gsap.registerPlugin(useGSAP, ScrollTrigger)

interface Showcase {
  label: string
  /** 두 줄 제목. 둘째 줄은 브랜드 색으로 강조한다 */
  title: [string, string]
  description: string
  media: ReactNode
}

// 캡처한 실제 잇다 화면(idta.store, 1440x900 을 2배로 찍어 1800px 로 줄임). 화면이 바뀌면 다시 찍는다
function Screen({ src, alt }: { src: string; alt: string }) {
  return <Image src={src} alt={alt} fill sizes="(max-width: 768px) 120vw, 65vw" className="object-cover object-top" />
}

const SHOWCASES: Showcase[] = [
  {
    label: "능력자 찾기",
    title: ["찾고 있던 능력자를,", "조건에 맞게 바로."],
    description: "분야와 정렬로 필요한 서비스를 좁히고, 가격과 평점을 한눈에 비교하세요.",
    media: <Screen src="/landing/screens/search.webp" alt="잇다 능력자 찾기 화면" />,
  },
  {
    label: "서비스 상세",
    title: ["가격과 구성까지,", "문의 전에 확인하고."],
    description: "플랜별 가격과 포함 내용을 먼저 보고, 마음에 들면 바로 문의를 시작합니다.",
    media: <Screen src="/landing/screens/service.webp" alt="잇다 서비스 상세 화면" />,
  },
  {
    label: "채팅 · 계약 · 결제",
    title: ["문의부터 결제까지,", "대화 한 곳에서."],
    description: "견적을 나누고 계약서를 주고받고, 대금은 잇다가 안전하게 맡아 둡니다.",
    media: (
      // 로그인해야 보이는 화면이라 캡처 대신 앱 톤으로 그린 화면을 같은 창 모양에 담는다
      <div className="absolute inset-0 grid content-center gap-4 bg-zinc-50 p-4 md:grid-cols-[3fr_2fr] md:gap-6 md:p-8">
        <ChatMock />
        <div className="hidden flex-col justify-end md:flex">
          <PaymentMock />
        </div>
      </div>
    ),
  },
  {
    label: "커뮤니티",
    title: ["궁금한 건,", "먼저 겪어 본 이웃에게."],
    description: "견적이 적당한지, 어떤 능력자가 좋은지 커뮤니티에서 묻고 답하세요.",
    media: <Screen src="/landing/screens/community.webp" alt="잇다 커뮤니티 화면" />,
  },
  {
    label: "블록체인 검증",
    title: ["기록된 거래는,", "누구나 확인할 수 있게."],
    description: "모든 결제 기록은 블록체인에 남고, 주문번호 하나로 직접 검증할 수 있습니다.",
    media: <Screen src="/landing/screens/verify.webp" alt="잇다 블록체인 검증 화면" />,
  },
]

// 항목 하나를 넘기는 데 쓰는 스크롤 길이(px)
const ITEM_LENGTH = 700

// 화면을 고정해 두고 스크롤에 따라 글과 화면만 갈아 끼운다. 페이지가 내려가지 않아 한 자리에서 제품을 넘겨 보는 느낌을 준다.
// 화면 그림은 오른쪽 밖으로 넘치게 두어 제품을 앞세운다
export default function ShowcaseSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)

  useGSAP(
    () => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        // 항목마다 같은 길이를 준다. 마지막 항목도 나오자마자 풀리지 않고 한 칸만큼 머문 뒤에 고정이 풀린다
        end: `+=${ITEM_LENGTH * SHOWCASES.length}`,
        pin: true,
        onUpdate: (self) => setActive(Math.min(SHOWCASES.length - 1, Math.floor(self.progress * SHOWCASES.length))),
      })
    },
    { scope: sectionRef }
  )

  return (
    // 화면 그림을 오른쪽 밖으로 넘기므로 가로 스크롤이 생기지 않게 잘라 둔다
    <section ref={sectionRef} className="relative h-svh overflow-hidden bg-zinc-50">
      <div className="mx-auto grid h-full w-full max-w-[1280px] grid-rows-[auto_1fr] gap-8 px-5 pt-20 pb-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:grid-rows-1 md:items-center md:gap-16 md:px-10 md:py-0 xl:px-20">
        {/* 글: 모든 항목을 한 칸에 겹쳐 두고 지금 것만 보인다. 가장 긴 글 높이로 칸이 잡혀 바뀔 때 흔들리지 않는다 */}
        <div className="flex flex-col gap-6 md:gap-10">
          <div className="grid">
            {SHOWCASES.map((item, i) => (
              <div
                key={item.label}
                aria-hidden={i !== active}
                className={`col-start-1 row-start-1 flex flex-col gap-4 transition-all duration-500 ease-out md:gap-5 ${
                  i === active ? "translate-y-0 opacity-100" : i < active ? "-translate-y-4 opacity-0" : "translate-y-4 opacity-0"
                }`}
              >
                <p className="text-sm font-semibold text-main">{item.label}</p>
                <h3 className="text-3xl font-extrabold leading-[1.3] tracking-tight text-ink md:text-5xl">
                  {item.title[0]}
                  <br />
                  <span className="text-main">{item.title[1]}</span>
                </h3>
                <p className="leading-relaxed text-ink-sub md:text-lg">{item.description}</p>
              </div>
            ))}
          </div>

          {/* 몇 번째인지: 지금 항목만 길게 늘어난다 */}
          <div className="flex gap-2">
            {SHOWCASES.map((item, i) => (
              <span
                key={item.label}
                className={`h-1.5 rounded-full transition-all duration-500 ${i === active ? "w-8 bg-main" : "w-1.5 bg-zinc-300"}`}
              />
            ))}
          </div>
        </div>

        {/* 화면: 브라우저 창 하나에 모든 화면을 겹쳐 두고 지금 것만 보인다 */}
        <div className="relative min-h-0 w-[115%] self-stretch md:w-[135%] md:self-center">
          <div className="relative h-full overflow-hidden rounded-2xl border border-line bg-white shadow-[0_40px_80px_-30px_rgba(24,24,27,.35)] md:aspect-[16/10] md:h-auto md:rounded-3xl">
            {/* 브라우저 창처럼 보이게 맨 위에 점 세 개를 둔다 */}
            <div className="relative z-10 flex gap-1.5 border-b border-line bg-white px-4 py-3">
              {[0, 1, 2].map((i) => <span key={i} className="size-2.5 rounded-full bg-zinc-200" />)}
            </div>
            <div className="absolute inset-x-0 top-[37px] bottom-0">
              {SHOWCASES.map((item, i) => (
                <div
                  key={item.label}
                  aria-hidden={i !== active}
                  className={`absolute inset-0 transition-all duration-700 ease-out ${
                    i === active ? "scale-100 opacity-100" : "scale-[1.03] opacity-0"
                  }`}
                >
                  {item.media}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
