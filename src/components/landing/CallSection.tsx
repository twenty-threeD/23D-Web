"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import { MdCallEnd, MdMic, MdScreenShare, MdVideocam, MdVideocamOff } from "react-icons/md"

gsap.registerPlugin(useGSAP, ScrollTrigger)

const STEPS = [
  {
    label: "음성 통화",
    title: ["채팅하다가 바로,", "전화로."],
    description: "번호를 주고받지 않아도, 채팅방에서 바로 상대에게 전화를 걸 수 있어요.",
  },
  {
    label: "영상 통화",
    title: ["현장은 말보다,", "영상으로."],
    description: "고칠 곳이나 작업 결과를 카메라로 비춰 바로 보여주고 확인해요.",
  },
  {
    label: "화면 공유",
    title: ["같은 화면을 보며,", "한 번에."],
    description: "시안이나 견적을 화면에 띄워 두고 함께 짚어 가며 이야기해요.",
  },
] as const

// 단계 하나를 넘기는 데 쓰는 스크롤 길이(px)
const STEP_LENGTH = 700

// 잇다의 특장점인 통화 기능을 따로 보여준다. 채팅방 안에서 음성 → 영상 → 화면 공유로 넓어지는 흐름을
// 실제 통화 화면(CallDock·CallOverlay)과 같은 어두운 창·동그란 버튼으로 그린다.
// 통화는 로그인한 두 사람이 있어야 찍을 수 있어 캡처 대신 같은 톤으로 그렸다
export default function CallSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [step, setStep] = useState(0)
  const fillRefs = useRef<(HTMLSpanElement | null)[]>([])

  useGSAP(
    () => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        // 단계마다 같은 길이를 준다. 마지막 단계도 나오자마자 풀리지 않고 한 칸만큼 머문다
        end: `+=${STEP_LENGTH * STEPS.length}`,
        pin: true,
        onUpdate: (self) => {
          const position = self.progress * STEPS.length
          setStep(Math.min(STEPS.length - 1, Math.floor(position)))
          fillRefs.current.forEach((fill, i) => {
            if (fill) fill.style.transform = `scaleX(${Math.min(1, Math.max(0, position - i))})`
          })
        },
      })
    },
    { scope: sectionRef }
  )

  // 단계가 바뀔 때 크기·위치는 그대로 두고 겹쳐 흐려지며 바뀐다
  const fade = (on: boolean) => `transition-opacity duration-500 ease-out ${on ? "opacity-100" : "opacity-0"}`

  return (
    <section ref={sectionRef} className="relative h-svh overflow-hidden bg-night text-white">
      <div className="mx-auto grid h-full w-full max-w-[1280px] grid-rows-[auto_1fr] gap-8 px-5 pt-20 pb-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:grid-rows-1 md:items-center md:gap-16 md:px-10 md:py-0 xl:px-20">
        <div className="flex flex-col gap-6 md:gap-10">
          <div className="grid">
            {STEPS.map((item, i) => (
              <div key={item.label} aria-hidden={i !== step} className={`col-start-1 row-start-1 flex flex-col gap-4 md:gap-5 ${fade(i === step)}`}>
                <p className="text-sm font-semibold text-main">{item.label}</p>
                <h2 className="text-3xl font-extrabold leading-[1.3] md:text-5xl">
                  {item.title[0]}
                  <br />
                  <span className="text-main">{item.title[1]}</span>
                </h2>
                <p className="leading-relaxed text-white/60 md:text-lg">{item.description}</p>
              </div>
            ))}
          </div>

          {/* 제품 소개와 같은 진행 막대 */}
          <div className="flex gap-1.5">
            {STEPS.map((item, i) => (
              <span key={item.label} className="h-1 w-8 overflow-hidden rounded-full bg-white/15 md:w-10">
                <span
                  ref={(el) => {
                    fillRefs.current[i] = el
                  }}
                  className="block size-full origin-left rounded-full bg-main"
                  style={{ transform: "scaleX(0)" }}
                />
              </span>
            ))}
          </div>
        </div>

        {/* 통화 창 */}
        <div className="flex min-h-0 items-center justify-center">
          <div className="relative aspect-[4/5] w-full max-w-[min(100%,48svh)] overflow-hidden rounded-3xl bg-[#17161c] shadow-2xl ring-1 ring-white/10 md:aspect-[16/11] md:max-w-none">
            {/* 1) 음성 통화: 상대 프로필이 가운데서 울린다 */}
            <div className={`absolute inset-0 flex flex-col items-center justify-center gap-4 ${fade(step === 0)}`}>
              <div className="relative flex items-center justify-center">
                <span className="absolute size-28 rounded-full bg-white/10 animate-call-pulse" />
                <Image src="/profile.webp" alt="" width={96} height={96} className="relative size-24 rounded-full object-cover ring-[3px] ring-main" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <p className="text-lg font-bold">박능력</p>
                <p className="text-sm text-white/50 tabular-nums">음성 통화 중 · 01:24</p>
              </div>
            </div>

            {/* 2) 영상 통화: 상대 카메라가 화면을 채운다 */}
            <div className={`absolute inset-0 ${fade(step === 1)}`}>
              <Image src="/landing/photos/hammer.webp" alt="" fill sizes="(max-width: 768px) 90vw, 700px" className="object-cover" />
              <Label>박능력</Label>
            </div>

            {/* 3) 화면 공유: 공유한 화면이 주인공이 되고 상대 카메라는 작은 창으로 내려간다 */}
            <div className={`absolute inset-0 bg-white ${fade(step === 2)}`}>
              <Image src="/landing/screens/service.webp" alt="" fill sizes="(max-width: 768px) 90vw, 700px" className="object-cover object-top" />
              <Label>화면 공유</Label>
              <div className="absolute top-4 right-4 aspect-[3/4] w-[22%] overflow-hidden rounded-xl ring-2 ring-white/80 shadow-lg">
                <Image src="/landing/photos/hammer.webp" alt="" fill sizes="160px" className="object-cover" />
              </div>
            </div>

            {/* 조작 버튼. 단계에 따라 켜진 기능이 달라진다 */}
            <div className="absolute inset-x-0 bottom-0 flex justify-center gap-3 bg-gradient-to-t from-black/60 to-transparent pt-10 pb-5">
              <ControlButton>
                <MdMic />
              </ControlButton>
              <ControlButton tone={step === 0 ? "off" : "normal"}>{step === 0 ? <MdVideocamOff /> : <MdVideocam />}</ControlButton>
              <ControlButton tone={step === 2 ? "on" : "normal"}>
                <MdScreenShare />
              </ControlButton>
              <ControlButton tone="danger">
                <MdCallEnd />
              </ControlButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="absolute top-4 left-4 rounded-full bg-black/50 px-3 py-1 text-xs font-semibold backdrop-blur-sm">{children}</span>
}

// 통화 화면의 CallButton 과 같은 색 규칙 (off = 꺼둔 기능은 흰 버튼, on = 켜둔 기능은 브랜드 색)
function ControlButton({ tone = "normal", children }: { tone?: "normal" | "off" | "on" | "danger"; children: React.ReactNode }) {
  const tones = {
    normal: "bg-white/15 text-white",
    off: "bg-white text-zinc-900",
    on: "bg-main text-white",
    danger: "bg-red-500 text-white",
  }
  return (
    <span aria-hidden className={`flex size-11 items-center justify-center rounded-full text-xl transition-colors duration-300 ${tones[tone]}`}>
      {children}
    </span>
  )
}
