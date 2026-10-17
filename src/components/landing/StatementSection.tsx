"use client"

import { useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(useGSAP, ScrollTrigger)

const LINES = ["거래가 끝나도,", "신뢰는 남으니까."]

// 첫 화면과 제품 소개 사이에 숨을 고르는 한 문장.
// 빈 흰 화면을 고정해 두고, 스크롤을 내리는 만큼 글자가 앞에서부터 하나씩 나타난다.
// 다 나온 뒤에도 잠시 머물러야 문장을 읽을 틈이 생긴다
const REVEAL_LENGTH = 1200 // 글자가 다 나타나는 데 쓰는 스크롤 길이(px)
const HOLD_LENGTH = 500 // 다 나온 뒤 머무는 길이(px)
export default function StatementSection() {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const total = REVEAL_LENGTH + HOLD_LENGTH
        const tl = gsap.timeline({
          scrollTrigger: { trigger: sectionRef.current, start: "top top", end: `+=${total}`, pin: true, scrub: 0.4 },
        })
        tl.fromTo("[data-char]", { opacity: 0, y: 24 }, { opacity: 1, y: 0, stagger: 0.06, ease: "power2.out", duration: 0.4 })
        // 글자가 다 나온 뒤 머무는 구간. 타임라인 길이 비율을 스크롤 길이 비율과 맞춘다
        tl.to({}, { duration: tl.duration() * (HOLD_LENGTH / REVEAL_LENGTH) })
      })
      return () => mm.revert()
    },
    { scope: sectionRef }
  )

  return (
    <section ref={sectionRef} className="h-svh bg-white">
      <div className="mx-auto flex h-svh w-full max-w-[1280px] items-center justify-center px-5 md:px-10 xl:px-20">
        <h2 className="text-center text-4xl font-extrabold leading-[1.25] tracking-tight text-ink md:text-7xl">
          {LINES.map((line, i) => (
            <span key={line} className="block">
              {/* 글자마다 따로 진해지도록 한 글자씩 나눈다. 띄어쓰기는 그대로 둬야 줄바꿈 위치가 바뀌지 않는다 */}
              {[...line].map((char, j) => (
                <span key={j} data-char className={i === 1 && j < 3 ? "text-main" : undefined}>
                  {char}
                </span>
              ))}
            </span>
          ))}
        </h2>
      </div>
    </section>
  )
}
