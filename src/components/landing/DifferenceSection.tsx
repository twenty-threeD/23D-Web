"use client"

import { useRef, type ReactNode } from "react"
import Image from "next/image"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import { PaymentMock, ReviewMock } from "./mocks"

interface DifferenceCard {
  title: [string, string]
  /** 배경 사진. 없으면 어두운 바탕 카드가 된다 */
  photo?: string
  overlay: ReactNode
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-sm">
      <span className="flex size-4 items-center justify-center rounded-full bg-main text-[10px] text-white">✓</span>
      {children}
    </span>
  )
}

// 실제 잇다 화면(idta.store)에서 잘라 낸 조각. 화면이 바뀌면 다시 찍는다
function Capture({ src, alt, width, height }: { src: string; alt: string; width: number; height: number }) {
  return <Image src={src} alt={alt} width={width} height={height} sizes="360px" className="w-full rounded-2xl shadow-sm" />
}

// 배경 사진은 잇다에 실제로 올라온 서비스 사진을 카드 비율(400x520)로 잘라 썼다. 카드 문장과 어울리는 서비스를 골랐다
const CARDS: DifferenceCard[] = [
  {
    title: ["후기를 다 읽지 않아도,", "핵심만 한눈에."],
    photo: "/landing/photos/card-review.webp",
    overlay: <ReviewMock />,
  },
  {
    title: ["대금은 안전하게,", "정산은 투명하게."],
    photo: "/landing/photos/card-payment.webp",
    overlay: <PaymentMock />,
  },
  {
    title: ["누군가의 거래가,", "나의 신뢰가 됩니다."],
    photo: "/landing/photos/card-trust.webp",
    overlay: (
      <div className="flex flex-wrap gap-2">
        <Chip>일정 준수</Chip>
        <Chip>꼼꼼해요</Chip>
        <Chip>소통 빨라요</Chip>
      </div>
    ),
  },
  {
    title: ["기록은 남고,", "위조는 남지 않습니다."],
    photo: "/landing/photos/card-record.webp",
    overlay: <Capture src="/landing/cards/blocks.webp" alt="잇다 블록체인 검증 화면의 최근 블록 목록" width={760} height={458} />,
  },
  {
    title: ["필요한 순간,", "가까운 능력자와."],
    photo: "/landing/photos/card-nearby.webp",
    overlay: <Capture src="/landing/cards/search.webp" alt="잇다 능력자 찾기 화면의 서비스 카드" width={760} height={503} />,
  },
]

gsap.registerPlugin(useGSAP, ScrollTrigger)

// 기능 이름 대신 "그래서 무엇이 좋아지는지"를 카드 한 장에 한 문장으로 보여준다.
// 화면을 고정해 두고, 아래로 스크롤하는 만큼 카드 줄이 옆으로 흘러간다
export default function DifferenceSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const rowRef = useRef<HTMLUListElement>(null)

  useGSAP(
    () => {
      const row = rowRef.current
      if (!row) return
      // 카드 줄이 화면보다 넘친 만큼만 옮긴다. 화면 크기가 바뀌면 다시 잰다
      const distance = () => Math.max(0, row.scrollWidth - window.innerWidth)
      gsap.to(row, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.5,
          invalidateOnRefresh: true,
        },
      })
    },
    { scope: sectionRef }
  )

  return (
    <section ref={sectionRef} className="h-svh overflow-hidden bg-white">
      <div className="flex h-full w-full flex-col justify-center gap-8 pt-16 md:gap-14 md:pt-0">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-4 px-5 md:px-10 xl:px-20">
          <p className="text-sm font-semibold text-main">잇다만의 차이</p>
          <h2 className="text-3xl font-extrabold leading-[1.3] text-ink md:text-5xl">
            믿을 수 있는 능력자가,
            <br />
            좋은 결과로 이어지도록.
          </h2>
        </div>

        {/* 카드 줄은 시작선을 위 제목(1280px 칸 + 80px 여백)과 맞추고, 옆으로 옮겨질 만큼 화면 밖으로 이어 둔다 */}
        <ul ref={rowRef} className="flex w-max gap-4 px-5 md:gap-6 md:px-10 xl:px-[max(80px,calc((100vw-1280px)/2+80px))]">
          {CARDS.map((card) => (
            <li
              key={card.title[0]}
              className={`relative flex h-[min(440px,58svh)] w-[min(380px,82vw)] shrink-0 flex-col justify-between overflow-hidden rounded-3xl p-6 md:h-[min(520px,60svh)] md:w-[400px] md:p-7 ${
                card.photo ? "bg-zinc-800" : "bg-night"
              }`}
            >
              {card.photo && (
                <>
                  <Image src={card.photo} alt="" fill sizes="400px" className="object-cover" />
                  {/* 아래 흰 글씨가 사진 위에서도 읽히도록 아래쪽만 어둡게 덮는다 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/0" />
                </>
              )}
              <div className="relative">{card.overlay}</div>
              <p className="relative text-2xl font-extrabold leading-snug text-white md:text-[26px]">
                {card.title[0]}
                <br />
                {card.title[1]}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
