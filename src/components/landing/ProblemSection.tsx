"use client"

import { useRef, useState } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(useGSAP, ScrollTrigger)

const PROBLEMS = [
  {
    title: "대금 미지급",
    description: "작업을 마쳐도 대금이 들어오지 않습니다. 받을 돈이 있다는 걸 증명할 수단도 마땅치 않습니다.",
  },
  {
    title: "계약서 분쟁",
    description: "구두 합의와 고쳐 쓴 문서가 섞이면서, 무엇이 원본인지 아무도 확인할 수 없게 됩니다.",
  },
  {
    title: "검증 안 된 상대",
    description: "이력도 평판도 확인하기 어려운 채로, 매번 처음부터 상대를 믿고 시작해야 합니다.",
  },
]

// 카드 하나를 짚는 데 쓰는 스크롤 길이(px)
const ITEM_LENGTH = 600

// 화면을 고정해 두고 스크롤에 따라 문제를 하나씩 키워 보여준다.
// 첫 화면 영상과 같은 어두운 바탕으로 이어 받아 분위기를 끊지 않는다
export default function ProblemSection() {
  const sectionRef = useRef<HTMLElement>(null)
  // -1 이면 아직 아무 카드도 짚지 않은 처음 상태다 (제목만 읽히고 카드는 모두 흐리다)
  const [active, setActive] = useState(-1)

  useGSAP(
    () => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        // 제목만 보여 주는 첫 칸 + 카드마다 한 칸
        end: `+=${ITEM_LENGTH * (PROBLEMS.length + 1)}`,
        pin: true,
        onUpdate: (self) =>
          setActive(Math.min(PROBLEMS.length - 1, Math.floor(self.progress * (PROBLEMS.length + 1)) - 1)),
      })
    },
    { scope: sectionRef }
  )

  return (
    <section ref={sectionRef} className="h-svh overflow-hidden bg-night text-white">
      <div className="mx-auto flex h-full w-full max-w-[1280px] flex-col justify-center gap-10 px-5 pt-16 md:gap-16 md:px-10 md:pt-0 xl:px-20">
        <div className="flex flex-col gap-4 md:gap-5">
          <p className="text-sm font-semibold tracking-[0.2em] text-main">PROBLEM</p>
          <h2 className="text-3xl font-extrabold leading-[1.25] tracking-tight md:text-6xl">
            프리랜서 거래를 막는 것은
            <br />
            실력이 아니라 <span className="text-main">불신</span>입니다
          </h2>
        </div>

        <ul className="grid gap-3 md:grid-cols-3 md:items-center md:gap-6">
          {PROBLEMS.map((problem, i) => (
            <li
              key={problem.title}
              data-active={i === active}
              // 지금 카드만 선명하게 키우고 테두리·번호를 브랜드 색으로 밝힌다. 나머지는 흐리게(블러) 물러나 있다
              className="group flex origin-center flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-5 opacity-40 blur-[3px] transition-all duration-500 ease-out data-[active=true]:border-main/60 data-[active=true]:blur-none data-[active=true]:bg-white/[0.07] data-[active=true]:opacity-100 data-[active=true]:shadow-[0_30px_80px_-20px_rgba(254,106,76,.35)] md:scale-95 md:gap-10 md:p-8 md:data-[active=true]:scale-105"
            >
              <span className="text-4xl font-extrabold leading-none text-white/15 transition-colors duration-500 group-data-[active=true]:text-main md:text-6xl">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex flex-col gap-2 md:gap-3">
                <h3 className="text-xl font-bold md:text-2xl">{problem.title}</h3>
                {/* 휴대폰은 세 카드가 한 화면에 들어오도록 지금 카드의 설명만 펼친다 */}
                <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-500 group-data-[active=true]:grid-rows-[1fr] md:grid-rows-[1fr]">
                  <p className="overflow-hidden leading-relaxed text-white/60">{problem.description}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
