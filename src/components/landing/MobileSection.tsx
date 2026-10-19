"use client"

import { useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import PhoneFrame, { PhoneShadow } from "./PhoneFrame"

gsap.registerPlugin(useGSAP, ScrollTrigger)

interface Phone {
  src: string
  alt: string
  /** 다 펼쳐졌을 때 자리. 휴대폰 폭에 대한 비율이라 화면 크기가 달라도 같은 모양으로 벌어진다 */
  spread: { xPercent: number; yPercent: number; rotation: number; scale: number }
  /** 세 대가 똑같이 출렁이면 한 덩어리처럼 보여서 떠오르는 박자를 조금씩 어긋나게 한다 */
  floatDelay: string
}

// 가운데(메인)를 맨 앞에 두고, 양옆은 뒤에서 비스듬히 빠져나온다. 배열 순서가 곧 쌓이는 순서다
const PHONES: Phone[] = [
  {
    src: "/landing/mobile/app-search.webp",
    alt: "잇다 앱 능력자 찾기 화면",
    spread: { xPercent: -66, yPercent: 7, rotation: -9, scale: 0.84 },
    floatDelay: "-1.6s",
  },
  {
    src: "/landing/mobile/app-service.webp",
    alt: "잇다 앱 서비스 상세 화면",
    spread: { xPercent: 66, yPercent: 7, rotation: 9, scale: 0.84 },
    floatDelay: "-3.2s",
  },
  {
    src: "/landing/mobile/app-main.webp",
    alt: "잇다 앱 메인 화면",
    spread: { xPercent: 0, yPercent: 0, rotation: 0, scale: 1 },
    floatDelay: "0s",
  },
]

const POINTS = [
  { title: "엄지 하나로 어디든", description: "하단 메뉴에서 커뮤니티부터 블록체인 검증까지 바로 오갑니다." },
  { title: "문의·계약·결제를 그대로", description: "PC에서 나누던 대화와 계약을 휴대폰에서 이어 갑니다." },
  { title: "원스토어에서 바로 설치", description: "안드로이드 앱으로 채팅·전화 알림까지 놓치지 않고 받아요." },
]

// 휴대폰이 펼쳐지는 데 쓰는 스크롤 길이(px)와, 아래 설명이 하나씩 나오는 데 쓰는 길이
const SPREAD_LENGTH = 700
const POINTS_LENGTH = 700
const HOLD_LENGTH = 400

// 잇다를 휴대폰에서도 그대로 쓸 수 있다는 것을 보여준다.
// 화면을 고정해 두고, 처음에는 메인 화면 한 대만 보이다가 스크롤하면 뒤에 겹쳐 있던 두 대가 양옆으로 펼쳐진다
export default function MobileSection() {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const phones = gsap.utils.toArray<HTMLElement>("[data-phone]")
      const mm = gsap.matchMedia()

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: `+=${SPREAD_LENGTH + POINTS_LENGTH + HOLD_LENGTH}`,
            pin: true,
            scrub: 0.5,
          },
        })
        // 시간 단위를 스크롤 길이(px)와 같게 두어 구간 길이를 위 상수로 바로 읽을 수 있게 한다
        phones.forEach((phone, i) => {
          tl.fromTo(
            phone,
            { xPercent: 0, yPercent: 0, rotation: 0, scale: PHONES[i].spread.scale },
            { ...PHONES[i].spread, duration: SPREAD_LENGTH, ease: "power2.out" },
            0
          )
        })
        tl.fromTo(
          "[data-point]",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: POINTS_LENGTH / POINTS.length, stagger: POINTS_LENGTH / POINTS.length, ease: "power2.out" },
          SPREAD_LENGTH
        )
        tl.to({}, { duration: HOLD_LENGTH })
      })

      // 움직임을 줄인 사용자에게는 고정 없이 다 펼쳐진 모습만 보여준다
      mm.add("(prefers-reduced-motion: reduce)", () => {
        phones.forEach((phone, i) => gsap.set(phone, PHONES[i].spread))
      })

      return () => mm.revert()
    },
    { scope: sectionRef }
  )

  return (
    <section ref={sectionRef} className="relative h-svh overflow-hidden bg-zinc-50">
      <div className="mx-auto grid h-full w-full max-w-[1280px] grid-rows-[auto_1fr] gap-6 px-5 pt-20 pb-8 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:grid-rows-1 md:items-center md:gap-16 md:px-10 md:py-0 xl:px-20">
        <div className="flex flex-col gap-6 md:gap-10">
          <div className="flex flex-col gap-4 md:gap-5">
            <p className="text-sm font-semibold text-main">모바일</p>
            <h2 className="text-3xl font-extrabold leading-[1.3] text-ink md:text-5xl">
              손 안에서도,
              <br />
              <span className="text-main">잇다</span> 그대로.
            </h2>
          </div>

          <ul className="flex flex-col gap-3 md:gap-6">
            {POINTS.map((point) => (
              <li key={point.title} data-point className="flex gap-3">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-main text-[11px] font-bold text-white md:size-6 md:text-xs">✓</span>
                <div className="flex flex-col gap-1">
                  <p className="font-bold text-ink md:text-lg">{point.title}</p>
                  {/* 휴대폰 폭에서는 휴대폰 그림이 들어갈 자리가 모자라 제목만 남긴다 */}
                  <p className="hidden leading-relaxed text-ink-sub md:block">{point.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex min-h-0 items-center justify-center">
          {PHONES.map((phone, i) => (
            <div
              key={phone.src}
              data-phone
              // 펼쳐지기 전에는 세 대가 같은 자리에 겹쳐 있어 맨 앞의 메인 화면만 보인다
              className="absolute w-[min(35vw,21svh)] md:w-[min(250px,27svh)]"
              style={{ zIndex: i === PHONES.length - 1 ? 1 : 0 }}
            >
              <div className="flex flex-col items-center gap-5 md:gap-8">
                <div className="w-full animate-phone-float" style={{ animationDelay: phone.floatDelay }}>
                  <PhoneFrame src={phone.src} alt={phone.alt} />
                </div>
                <PhoneShadow className="animate-phone-float-shadow" style={{ animationDelay: phone.floatDelay }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
