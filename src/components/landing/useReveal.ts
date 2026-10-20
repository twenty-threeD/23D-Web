"use client"

import { type RefObject } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(useGSAP, ScrollTrigger)

// scope 안에서 data-reveal 이 붙은 요소를 화면에 들어올 때 아래에서 떠오르게 한다.
// 한 번에 들어온 요소끼리는 순서대로 조금씩 늦게 나와, 카드 묶음이 한 덩어리로 툭 나타나지 않는다.
// 움직임 줄이기 설정이면 처음부터 보이게 둔다 (숨겨 둔 채 끝나면 내용을 못 본다)
export function useReveal(scope: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const targets = gsap.utils.toArray<HTMLElement>("[data-reveal]")
        gsap.set(targets, { autoAlpha: 0, y: 40 })
        ScrollTrigger.batch(targets, {
          start: "top 85%",
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.12 }),
        })
      })
      return () => mm.revert()
    },
    { scope }
  )
}
