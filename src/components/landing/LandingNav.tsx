"use client"

import { useEffect, useRef, useState } from "react"

type Tone = "light" | "dark"

export interface LandingSectionInfo {
  /** LandingSection 의 id 와 같아야 한다 */
  id: string
  /** 바탕이 어두우면 진행 바 바탕을 밝은 색으로 바꾼다 */
  tone?: Tone
}

// 진행 바가 위치를 재는 섹션을 감싼다.
// 섹션 대부분이 화면을 고정(pin)하는데, 고정하면 GSAP 가 섹션 바깥에 고정 길이만큼의 자리(pin-spacer)를 덧씌운다.
// 그래서 섹션 자체가 아니라 이 껍데기의 위치를 재야 고정 구간까지 포함한 진짜 시작·끝을 알 수 있다.
// flex 로 감싸면 고정 자리가 사라지므로(page.tsx 참고) 평범한 div 로 둔다
export function LandingSection({ id, children }: { id: string; children: React.ReactNode }) {
  return <div data-landing-section={id}>{children}</div>
}

// 랜딩 왼쪽에 떠 있는 진행 바. 얼마나 내려왔는지를 주황 막대로 보여준다.
// 바탕이 어두운 섹션에서는 막대 바탕색을 밝게 바꿔야 해서, 화면 가운데에 걸친 섹션이 어느 것인지도 함께 잰다
export default function LandingNav({ sections }: { sections: LandingSectionInfo[] }) {
  const [active, setActive] = useState(0)
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const elements = sections.map((section) => document.querySelector<HTMLElement>(`[data-landing-section="${section.id}"]`))

    let frame = 0
    const update = () => {
      frame = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      // 진행 바는 스크롤마다 바뀌어 리렌더 대신 스타일만 바로 고친다
      if (progressRef.current) progressRef.current.style.transform = `scaleY(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`

      const middle = window.innerHeight / 2
      let current = 0
      elements.forEach((el, i) => {
        if (el && el.getBoundingClientRect().top <= middle) current = i
      })
      setActive(current)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    // 새로고침하면 브라우저가 이전 스크롤 위치를 되살리므로 처음에도 한 번 잰다
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [sections])

  const dark = sections[active]?.tone === "dark"

  return (
    <div
      aria-hidden
      className={`fixed top-1/2 left-2 z-30 h-[32svh] w-[3px] -translate-y-1/2 overflow-hidden rounded-full transition-colors duration-500 md:left-5 md:h-[40svh] ${
        dark ? "bg-white/15" : "bg-zinc-900/10"
      }`}
    >
      {/* Tailwind 의 scale-y-* 는 transform 이 아닌 scale 속성을 써서, 위에서 고치는 transform 과 곱해진다. 처음 값도 transform 으로 준다 */}
      <div ref={progressRef} className="size-full origin-top rounded-full bg-main" style={{ transform: "scaleY(0)" }} />
    </div>
  )
}
