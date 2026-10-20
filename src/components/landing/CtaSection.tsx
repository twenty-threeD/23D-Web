"use client"

import { useRef } from "react"
import Link from "next/link"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import { PhoneShadow } from "./PhoneFrame"
import StoreButton from "./StoreButton"

gsap.registerPlugin(useGSAP, ScrollTrigger)

// 휴대폰이 한 바퀴 돌며 떠오르고 문구가 다 올라오는 데 쓰는 스크롤 길이(px)와, 그 뒤 머무는 길이
const ENTER_LENGTH = 1200
const HOLD_LENGTH = 300

// 휴대폰이 세로축으로 한 바퀴 도는 장면을 Blender(Cycles)로 렌더한 연속 프레임. 6도 간격 60장이고 1번이 정면이다.
// 조명은 그대로 두고 휴대폰만 돌려서, 도는 동안 반사광이 테두리·뒷면을 따라 흐른다
const TURN_FRAME_COUNT = 60
const TURN_WIDTH = 560
const TURN_HEIGHT = 1146
const turnFrameUrl = (index: number) => `/landing/turn/${String(index).padStart(3, "0")}.webp`

// 랜딩의 마지막 안내. 첫 화면의 "사람과 사람을 잇다" 를 다시 받아 행동으로 이어지게 한다.
// 휴대폰이 스크롤에 따라 한 바퀴 돌며 떠오르고, 문구가 아래에서 차례로 올라온다.
// 고정이 풀리면 이 화면이 위로 올라가며, 밑에 깔린 푸터가 끌려 나온다. 그래서 이 화면을 푸터보다 위(z-10)에 둔다
export default function CtaSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useGSAP(
    () => {
      // 스크롤 도중에 받으면 프레임이 비어 지나가므로 처음에 전부 받아 둔다
      const frames = Array.from({ length: TURN_FRAME_COUNT }, (_, i) => {
        const image = new Image()
        image.src = turnFrameUrl(i + 1)
        return image
      })
      let shown = -1
      const draw = (index: number) => {
        const canvas = canvasRef.current
        const frame = frames[index]
        if (!canvas || !frame.complete || index === shown) return
        const context = canvas.getContext("2d")
        if (!context) return
        context.clearRect(0, 0, canvas.width, canvas.height)
        context.drawImage(frame, 0, 0, canvas.width, canvas.height)
        shown = index
      }
      // 정면 프레임이 도착하면 바로 그려 둔다 (움직임 줄이기 설정이면 이 장면에서 멈춘다)
      frames[0].onload = () => draw(0)
      draw(0)

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
          { yPercent: 18, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: ENTER_LENGTH * 0.5, ease: "power2.out" },
          0
        )
        // 한 바퀴 돌아 다시 정면에서 멈춘다. 마지막 칸(60)은 첫 칸(정면)과 같은 자리라 0 으로 접는다
        const turn = { frame: 0 }
        shown = -1
        tl.to(
          turn,
          {
            frame: TURN_FRAME_COUNT,
            duration: ENTER_LENGTH,
            ease: "power1.inOut",
            onUpdate: () => draw(Math.round(turn.frame) % TURN_FRAME_COUNT),
          },
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

        <div className="flex min-h-0 items-center justify-center">
          <div data-cta-phone className="w-[min(42vw,22svh)] md:w-[min(300px,32svh)]">
            <div className="flex flex-col items-center gap-6 md:gap-10">
              <div className="w-full animate-phone-float">
                <canvas
                  ref={canvasRef}
                  width={TURN_WIDTH}
                  height={TURN_HEIGHT}
                  role="img"
                  aria-label="잇다 앱 메인 화면이 켜진 휴대폰"
                  className="h-auto w-full"
                />
              </div>
              <PhoneShadow className="animate-phone-float-shadow" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
