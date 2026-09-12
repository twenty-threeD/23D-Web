"use client"

import { useCallback, useEffect, useRef, useState } from "react"

interface Point {
  x: number
  y: number
}

// 값이 화면 밖으로 나가지 않게 잡아둔다. 놓친 창은 되찾을 방법이 없다.
function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

// 떠 있는 패널을 마우스로 옮긴다.
//
// 위치는 브라우저에 기억시킨다. 통화할 때마다 다시 옮기게 하면 귀찮고,
// 한 번 치워둔 자리에 그대로 뜨는 편이 예측 가능하다.
export function useDraggable(storageKey: string) {
  const ref = useRef<HTMLDivElement>(null)
  // null 이면 CSS 기본 위치(오른쪽 아래)를 그대로 쓴다.
  // 첫 렌더부터 저장된 자리에 그려야 패널이 기본 위치에서 한 번 튀지 않는다.
  const [pos, setPos] = useState<Point | null>(() => {
    if (typeof window === "undefined") return null
    try {
      const saved = localStorage.getItem(storageKey)
      return saved ? (JSON.parse(saved) as Point) : null
    } catch {
      // 저장값이 깨졌거나 저장소를 못 쓰는 경우. 기본 위치로 둔다.
      return null
    }
  })
  const grab = useRef<Point | null>(null)

  const keepInside = useCallback((p: Point): Point => {
    const el = ref.current
    const w = el?.offsetWidth ?? 0
    const h = el?.offsetHeight ?? 0
    return {
      x: clamp(p.x, 8, Math.max(8, window.innerWidth - w - 8)),
      y: clamp(p.y, 8, Math.max(8, window.innerHeight - h - 8)),
    }
  }, [])

  // 창을 줄이면 패널이 화면 밖으로 밀려날 수 있다
  useEffect(() => {
    const onResize = () => setPos((p) => (p ? keepInside(p) : p))
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [keepInside])

  const onPointerDown = (e: React.PointerEvent) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    grab.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    // 포인터를 가둬두면 커서가 패널 밖으로 빠르게 나가도 드래그가 끊기지 않는다
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!grab.current) return
    setPos(keepInside({ x: e.clientX - grab.current.x, y: e.clientY - grab.current.y }))
  }

  const onPointerUp = (e: React.PointerEvent) => {
    if (!grab.current) return
    grab.current = null
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    setPos((p) => {
      if (p) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(p))
        } catch {
          // 저장 못 해도 이번 세션 위치는 유지된다
        }
      }
      return p
    })
  }

  return {
    ref,
    // 옮긴 적이 없으면 스타일을 주지 않아 CSS 기본 위치가 살아 있다
    style: pos ? { left: pos.x, top: pos.y, right: "auto", bottom: "auto" } : undefined,
    handleProps: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp },
  }
}
