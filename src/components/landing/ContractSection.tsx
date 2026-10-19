"use client"

import { useEffect, useRef, useState } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(useGSAP, ScrollTrigger)

const STEPS = [
  { title: "계약 조건 합의", description: "금액·기간·작업 내용을 정해진 양식에 맞춰 함께 정리하고 서명합니다." },
  { title: "해시 생성", description: "완성된 계약서는 세상에 하나뿐인 지문값(해시)으로 바뀝니다." },
  { title: "블록에 기록", description: "해시가 블록체인에 올라가 순서와 시점이 확정됩니다." },
  { title: "위변조 불가", description: "한 글자만 바뀌어도 지문이 달라져 검증이 실패합니다. 원본은 언제든 증명됩니다." },
]

// 장면 안의 예시 값. 실제 거래가 아니라 흐름을 보여주기 위한 값이다
const CONTRACT_ROWS = [
  { label: "갑 (의뢰인)", value: "김의뢰" },
  { label: "을 (능력자)", value: "박능력" },
  { label: "용역 내용", value: "주방 인테리어 시공" },
  { label: "용역 기간", value: "10.20 – 11.03" },
]
const AMOUNT = "1,200,000원"
const TAMPERED_AMOUNT = "12,000,000원"
const HASH = "8f3a91c4e07b2d56a1f0c9e3b74d8a2c"
const HEX = "0123456789abcdef"

// 장면은 이 크기로 그리고, 들어갈 칸에 맞춰 통째로 줄인다. 휴대폰처럼 칸이 작아도 배치가 깨지지 않는다.
// 높이는 안의 내용(계약서·해시·블록·검증 칸)이 다 들어가는 크기여야 한다. 모자라면 칸이 눌려 글씨가 겹치므로 칸마다 shrink-0 을 준다
const STAGE_WIDTH = 440
const STAGE_HEIGHT = 640
// 단계 하나에 쓰는 스크롤 길이(px)
const STEP_LENGTH = 650

// 계약 → 해시 → 블록 → 검증을 화면을 고정한 채 스크롤로 한 단계씩 보여준다.
// 깨진 이미지 대신 실제 흐름을 그려서, 블록체인을 모르는 사람도 "왜 못 바꾸는지"를 눈으로 보게 한다
export default function ContractSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const stageBoxRef = useRef<HTMLDivElement>(null)
  const hashRef = useRef<HTMLSpanElement>(null)
  const [active, setActive] = useState(0)
  const [stageScale, setStageScale] = useState(1)

  // 장면 칸 크기가 바뀌면 고정 크기로 그린 장면을 칸에 맞춰 줄인다
  useEffect(() => {
    const box = stageBoxRef.current
    if (!box) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setStageScale(Math.min(1, width / STAGE_WIDTH, height / STAGE_HEIGHT))
    })
    observer.observe(box)
    return () => observer.disconnect()
  }, [])

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      // 움직임 줄이기 설정이면 고정·애니메이션 없이 다 끝난 장면을 보여준다
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set("[data-scene]", { autoAlpha: 1, y: 0, scale: 1 })
        if (hashRef.current) hashRef.current.textContent = `0x${HASH}`
        setActive(STEPS.length - 1)
      })

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const hash = { revealed: 0 }
        const paintHash = () => {
          if (!hashRef.current) return
          // 아직 확정되지 않은 자리는 무작위 글자로 흔들어, 계산되어 나오는 느낌을 준다
          const n = Math.round(hash.revealed * HASH.length)
          let text = HASH.slice(0, n)
          for (let i = n; i < HASH.length; i++) text += HEX[Math.floor(Math.random() * 16)]
          hashRef.current.textContent = `0x${text}`
        }

        gsap.set("[data-scene]:not([data-scene=contract])", { autoAlpha: 0, y: 24 })
        gsap.set("[data-scene=row], [data-scene=stamp]", { autoAlpha: 0, y: 10 })
        gsap.set("[data-scene=contract]", { autoAlpha: 1, y: 0 })

        const tl = gsap.timeline({
          defaults: { ease: "power2.out", duration: 0.5 },
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: `+=${STEP_LENGTH * STEPS.length}`,
            pin: true,
            scrub: 0.6,
            onUpdate: (self) => setActive(Math.min(STEPS.length - 1, Math.floor(self.progress * STEPS.length))),
          },
        })

        // 1) 계약 조건이 한 줄씩 채워지고 양쪽 서명이 찍힌다
        tl.to("[data-scene=row]", { autoAlpha: 1, y: 0, stagger: 0.15 })
          .to("[data-scene=stamp]", { autoAlpha: 1, y: 0, stagger: 0.15, ease: "back.out(2)" })
          // 2) 계약서 아래로 지문(해시)이 계산되어 나온다
          .to("[data-scene=hash]", { autoAlpha: 1, y: 0 }, "+=0.3")
          .to(hash, { revealed: 1, duration: 1, ease: "none", onUpdate: paintHash })
          // 3) 블록이 이어지고 마지막 블록에 해시가 담긴다
          .to("[data-scene=chain]", { autoAlpha: 1, y: 0 }, "+=0.3")
          // 블록은 옆에서 들어온다. 위에서 모든 장면을 24px 내려 둔 것까지 함께 되돌려야 아래 문구와 겹치지 않는다
          .fromTo("[data-scene=block]", { autoAlpha: 0, x: 30, y: 0 }, { autoAlpha: 1, x: 0, y: 0, stagger: 0.15 }, "<")
          .to("[data-scene=recorded]", { autoAlpha: 1, y: 0, ease: "back.out(2)" })
          // 4) 누군가 금액을 고치면 지문이 달라져 검증이 실패하고, 원본으로 돌아오면 통과한다
          .to("[data-scene=verify]", { autoAlpha: 1, y: 0 }, "+=0.3")
          .to("[data-scene=amount-original]", { autoAlpha: 0, duration: 0.2 })
          .to("[data-scene=amount-tampered]", { autoAlpha: 1, y: 0, duration: 0.2 }, "<")
          .to("[data-scene=fail]", { autoAlpha: 1, y: 0, duration: 0.2 }, "<")
          .to("[data-scene=amount-tampered]", { autoAlpha: 0, duration: 0.2 }, "+=0.6")
          .to("[data-scene=fail]", { autoAlpha: 0, duration: 0.2 }, "<")
          .to("[data-scene=amount-original]", { autoAlpha: 1, duration: 0.2 }, "<")
          .to("[data-scene=pass]", { autoAlpha: 1, y: 0, duration: 0.2 }, "<")
          .to({}, { duration: 0.4 })

        paintHash()
      })

      return () => mm.revert()
    },
    { scope: sectionRef }
  )

  return (
    <section ref={sectionRef} className="relative flex h-svh w-full overflow-hidden bg-white">
      <div className="mx-auto flex h-full w-full max-w-[1280px] flex-col gap-6 px-5 pt-20 pb-6 md:flex-row md:items-center md:gap-16 md:px-10 md:py-0 xl:px-20">
        {/* 글: 넓은 화면은 단계 목록을 모두, 휴대폰은 지금 단계만 보여준다 */}
        <div className="flex shrink-0 flex-col gap-5 md:w-[42%] md:gap-10">
          <div className="flex flex-col gap-3 md:gap-5">
            <p className="text-sm font-semibold text-main">해결</p>
            <h2 className="text-2xl font-extrabold leading-[1.3] text-ink md:text-5xl">
              계약서는 한 번 기록되면
              <br />
              누구도 바꿀 수 없습니다
            </h2>
          </div>

          <ol className="hidden flex-col md:flex">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                data-active={i === active}
                className="group flex gap-5 border-t border-line py-5 last:border-b"
              >
                <span className="w-6 shrink-0 text-sm font-bold text-ink-muted transition-colors duration-300 group-data-[active=true]:text-main">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-bold text-ink-muted transition-colors duration-300 group-data-[active=true]:text-ink">
                    {step.title}
                  </h3>
                  {/* 높이를 0fr → 1fr 로 바꿔 지금 단계의 설명만 부드럽게 연다 */}
                  <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-500 group-data-[active=true]:grid-rows-[1fr]">
                    <p className="overflow-hidden leading-relaxed text-ink-sub">{step.description}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>

          <div className="flex flex-col gap-2 md:hidden">
            <div className="flex gap-1.5">
              {STEPS.map((step, i) => (
                <span
                  key={step.title}
                  className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= active ? "bg-main" : "bg-zinc-200"}`}
                />
              ))}
            </div>
            <p className="text-lg font-bold text-ink">
              <span className="text-main">{String(active + 1).padStart(2, "0")}</span> {STEPS[active].title}
            </p>
            <p className="min-h-[3em] text-sm leading-relaxed text-ink-sub">{STEPS[active].description}</p>
          </div>
        </div>

        {/* 장면 */}
        <div ref={stageBoxRef} className="flex min-h-0 flex-1 items-center justify-center md:h-[80%]">
          <div
            className="relative shrink-0 origin-center"
            style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT, transform: `scale(${stageScale})` }}
          >
            <Stage hashRef={hashRef} />
          </div>
        </div>
      </div>
    </section>
  )
}

function Stage({ hashRef }: { hashRef: React.RefObject<HTMLSpanElement | null> }) {
  return (
    <div className="flex h-full w-full flex-col items-center gap-4 rounded-[32px] bg-zinc-50 p-6">
      {/* 계약서 */}
      <div data-scene="contract" className="flex w-full shrink-0 flex-col gap-4 rounded-2xl border border-line bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-base font-bold text-contract">용역 계약서</p>
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-ink-sub">No. 2026-1020</span>
        </div>
        <dl className="flex flex-col gap-2 text-sm">
          {CONTRACT_ROWS.map((row) => (
            <div key={row.label} data-scene="row" className="flex justify-between gap-4">
              <dt className="text-ink-muted">{row.label}</dt>
              <dd className="font-semibold text-ink">{row.value}</dd>
            </div>
          ))}
          <div data-scene="row" className="flex justify-between gap-4">
            <dt className="text-ink-muted">계약 금액</dt>
            {/* 원본과 고친 금액을 같은 자리에 겹쳐 두고 번갈아 보인다 */}
            <dd className="relative font-semibold text-ink">
              <span data-scene="amount-original">{AMOUNT}</span>
              <span data-scene="amount-tampered" className="absolute right-0 top-0 whitespace-nowrap text-red-500 line-through decoration-2">
                {TAMPERED_AMOUNT}
              </span>
            </dd>
          </div>
        </dl>
        <div className="flex gap-2 border-t border-dashed border-line pt-3">
          {["갑 서명", "을 서명"].map((label) => (
            <span key={label} data-scene="stamp" className="flex items-center gap-1.5 rounded-full border border-main/30 bg-main/5 px-3 py-1 text-xs font-semibold text-main">
              <CheckIcon className="size-3.5" />
              {label} 완료
            </span>
          ))}
        </div>
      </div>

      {/* 해시 */}
      <div data-scene="hash" className="flex w-full shrink-0 flex-col items-center gap-2">
        <ArrowDown />
        <div className="flex w-full items-center gap-3 rounded-xl bg-ink px-4 py-3">
          <span className="shrink-0 rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white/70">SHA-256</span>
          <span ref={hashRef} className="truncate font-mono text-[13px] text-white">0x</span>
        </div>
      </div>

      {/* 블록 */}
      <div data-scene="chain" className="flex w-full shrink-0 flex-col items-center gap-2">
        <ArrowDown />
        <div className="flex w-full items-center">
          {[1024, 1025, 1026].map((height, i) => (
            <div key={height} className="flex flex-1 items-center">
              {i > 0 && <span className="h-0.5 w-3 shrink-0 bg-line" />}
              <div
                data-scene="block"
                className={`flex flex-1 flex-col gap-1 rounded-xl border p-3 ${
                  i === 2 ? "border-main bg-white shadow-[0_8px_24px_rgba(254,106,76,.18)]" : "border-line bg-white"
                }`}
              >
                <span className="text-[10px] font-semibold text-ink-muted">BLOCK</span>
                <span className="text-sm font-bold text-ink">#{height.toLocaleString()}</span>
                <span className={`font-mono text-[10px] ${i === 2 ? "text-main" : "text-ink-muted"}`}>
                  {i === 2 ? "0x8f3a…8a2c" : i === 1 ? "0x41c0…e19b" : "0x07da…3f52"}
                </span>
              </div>
            </div>
          ))}
        </div>
        <span data-scene="recorded" className="flex items-center gap-1.5 text-xs font-semibold text-main">
          <CheckIcon className="size-3.5" /> 블록 #1,026 에 기록 완료
        </span>
      </div>

      {/* 검증 결과. 실패·통과를 같은 자리에 겹쳐 둔다 */}
      <div data-scene="verify" className="relative h-12 w-full shrink-0">
        <div data-scene="fail" className="absolute inset-0 flex items-center justify-center gap-2 rounded-xl bg-red-50 text-sm font-bold text-red-500">
          <XIcon className="size-4" /> 해시 불일치 · 위조된 계약서
        </div>
        <div data-scene="pass" className="absolute inset-0 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 text-sm font-bold text-emerald-600">
          <CheckIcon className="size-4" /> 원장 기록과 일치 · 원본 확인
        </div>
      </div>
    </div>
  )
}

function ArrowDown() {
  return (
    <svg viewBox="0 0 16 16" className="size-4 text-ink-muted" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M8 2v11M3.5 8.5 8 13l4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="m3.5 8.5 3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="m4 4 8 8M12 4l-8 8" strokeLinecap="round" />
    </svg>
  )
}
