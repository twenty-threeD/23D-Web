"use client"

import { useRef } from "react"
import Link from "next/link"
import { useReveal } from "./useReveal"

// 랜딩의 마지막 안내. 첫 화면의 "사람과 사람을 잇다" 를 다시 받아 행동으로 이어지게 한다
export default function CtaSection() {
  const sectionRef = useRef<HTMLElement>(null)
  useReveal(sectionRef)

  return (
    <section ref={sectionRef} className="bg-night text-white">
      <div className="mx-auto flex h-svh w-full max-w-[1280px] flex-col items-center justify-center gap-10 px-5 text-center md:gap-12 md:px-10 xl:px-20">
        <h2 data-reveal className="text-3xl font-extrabold leading-[1.3] tracking-tight md:text-6xl">
          필요한 순간, 필요한 능력자를
          <br />
          <span className="text-main">잇다</span>에서 만나보세요
        </h2>
        <p data-reveal className="text-white/60 md:text-lg">
          계약서는 블록체인에, 대금은 안전하게. 지금 바로 시작하세요.
        </p>
        <div data-reveal className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/main"
            className="rounded-full bg-main px-8 py-3.5 text-base font-bold text-white transition-colors hover:bg-white hover:text-ink"
          >
            지금 시작하기
          </Link>
          <Link
            href="/search"
            className="rounded-full border border-white/25 px-8 py-3.5 text-base font-bold text-white transition-colors hover:border-white"
          >
            능력자 찾아보기
          </Link>
        </div>
      </div>
    </section>
  )
}
