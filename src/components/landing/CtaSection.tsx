"use client"

import { useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import PhoneFrame, { PhoneShadow } from "./PhoneFrame"

gsap.registerPlugin(useGSAP, ScrollTrigger)

// 원스토어 상세 페이지 주소. 주소를 받기 전까지 비워 두며, 비어 있는 동안 버튼은 누를 수 없다.
// 주소가 나오면 여기만 채우면 된다
const ONESTORE_URL = ""

// 휴대폰이 바로 서고 문구가 다 올라오는 데 쓰는 스크롤 길이(px)와, 그 뒤 머무는 길이
const ENTER_LENGTH = 800
const HOLD_LENGTH = 300

// 랜딩의 마지막 안내. 첫 화면의 "사람과 사람을 잇다" 를 다시 받아 행동으로 이어지게 한다.
// 비스듬히 누워 있던 휴대폰이 스크롤에 따라 일어나 떠오르고, 문구가 아래에서 차례로 올라온다.
// 고정이 풀리면 이 화면이 위로 올라가며, 밑에 깔린 푸터가 끌려 나온다. 그래서 이 화면을 푸터보다 위(z-10)에 둔다
export default function CtaSection() {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: `+=${ENTER_LENGTH + HOLD_LENGTH}`,
            pin: true,
            scrub: 0.5,
          },
        })
        tl.fromTo(
          "[data-cta-phone]",
          { yPercent: 28, rotationX: 38, rotationY: -18, rotationZ: -10, opacity: 0 },
          { yPercent: 0, rotationX: 0, rotationY: 0, rotationZ: 0, opacity: 1, duration: ENTER_LENGTH, ease: "power2.out" },
          0
        )
        tl.fromTo(
          "[data-cta-line]",
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: ENTER_LENGTH * 0.5, stagger: ENTER_LENGTH * 0.15, ease: "power2.out" },
          ENTER_LENGTH * 0.1
        )
        tl.to({}, { duration: HOLD_LENGTH })

        // 푸터는 이 화면 밑에 깔려 있다가 스크롤하는 만큼 아래로 끌려 나온다.
        // 푸터는 사이트 공용(SiteChrome)이라 여기서 찾아 움직이고, 위치는 움직이지 않는 감싼 칸으로 잰다
        const footer = document.querySelector("footer")
        if (footer?.parentElement) {
          gsap.fromTo(
            footer,
            { yPercent: -60 },
            {
              yPercent: 0,
              ease: "none",
              scrollTrigger: { trigger: footer.parentElement, start: "top bottom", end: "bottom bottom", scrub: 0.8 },
            }
          )
        }
      })
      return () => mm.revert()
    },
    { scope: sectionRef }
  )

  return (
    <section ref={sectionRef} className="relative z-10 h-svh overflow-hidden bg-white">
      <div className="mx-auto grid h-full w-full max-w-[1280px] grid-rows-[auto_1fr] gap-8 px-5 pt-24 pb-8 md:grid-cols-2 md:grid-rows-1 md:items-center md:gap-16 md:px-10 md:py-0 xl:px-20">
        <div className="flex flex-col gap-6 md:gap-10">
          <div className="flex flex-col gap-4 md:gap-5">
            <h2 data-cta-line className="text-3xl font-extrabold leading-[1.3] text-ink md:text-6xl">
              필요한 순간,
              <br />
              필요한 능력자를
              <br />
              <span className="text-main">잇다</span>에서
            </h2>
            <p data-cta-line className="text-ink-sub md:text-lg">
              계약서는 블록체인에, 대금은 안전하게. 지금 바로 시작하세요.
            </p>
          </div>

          <div data-cta-line className="flex flex-wrap gap-3">
            <Link
              href="/main"
              className="flex h-16 items-center rounded-2xl bg-main px-8 text-lg font-bold text-white transition-colors hover:bg-orange-600"
            >
              지금 시작하기
            </Link>
            <StoreButton />
          </div>
        </div>

        {/* 휴대폰이 앞뒤로 눕고 일어나는 모습이 보이도록 원근을 준다 */}
        <div className="flex min-h-0 items-center justify-center [perspective:1400px]">
          <div data-cta-phone className="w-[min(42vw,22svh)] md:w-[min(300px,32svh)]">
            <div className="flex flex-col items-center gap-6 md:gap-10">
              <div className="w-full animate-phone-float">
                <PhoneFrame src="/landing/mobile/app-main-cta.webp" alt="잇다 앱 메인 화면" />
              </div>
              <PhoneShadow className="animate-phone-float-shadow" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// 스토어 배지처럼 생긴 원스토어 다운로드 버튼. 주소가 없으면 누를 수 없게 둔다
function StoreButton() {
  const className = "flex h-16 items-center gap-3 rounded-2xl bg-night pr-6 pl-4 text-white"
  const content = (
    <>
      {/* 원스토어 공식 사이트(onestore.co.kr)의 앱 아이콘 */}
      <Image src="/landing/onestore.webp" alt="" width={36} height={36} className="size-9" />
      <span className="flex flex-col leading-tight">
        <span className="text-xs text-white/60">다운로드</span>
        <span className="text-lg font-bold">원스토어</span>
      </span>
    </>
  )

  if (!ONESTORE_URL) {
    return (
      <span aria-disabled className={className}>
        {content}
      </span>
    )
  }
  return (
    <a href={ONESTORE_URL} target="_blank" rel="noreferrer" className={`${className} transition-colors hover:bg-ink`}>
      {content}
    </a>
  )
}
