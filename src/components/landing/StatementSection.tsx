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
        // 글자가 살짝 크게 흐릿하게 나타났다가 제자리 크기로 또렷해지며 한 글자씩 넘어간다.
        // 너무 크게 키우면 옆 글자와 겹쳐 어색해서 조금만 키우고, 바닥선을 기준으로 줄어들게 한다
        tl.fromTo(
          "[data-char]",
          { opacity: 0, scale: 1.25, filter: "blur(6px)", transformOrigin: "50% 100%" },
          { opacity: 1, scale: 1, filter: "blur(0px)", stagger: 0.06, ease: "power2.out", duration: 0.35 }
        )
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
        <h2 className="text-center text-4xl font-extrabold leading-[1.25] text-ink md:text-7xl">
          {LINES.map((line, i) => (
            <span key={line} className="block">
              {/* 글자마다 따로 움직이도록 한 글자씩 나눈다. 크기를 바꾸려면 inline-block 이어야 하고,
                  그러면 띄어쓰기 칸이 0 폭으로 접히므로 whitespace-pre 로 공백 폭을 지킨다 */}
              {[...line].map((char, j) => (
                <span key={j} data-char className={`inline-block whitespace-pre ${i === 1 && j < 3 ? "text-main" : ""}`}>
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
