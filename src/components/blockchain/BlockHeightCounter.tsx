"use client"
import {useEffect, useRef, useState} from "react"

const DURATION = 1200

// easeOutExpo: 빠르게 올라가다 목표값 근처에서 부드럽게 멈춘다
function easeOut(t: number) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

/**
 * 마운트 후 처음 받은 블록 높이는 0에서부터 세어 올리고,
 * 이후 갱신될 때는 값이 바뀐 자리의 숫자만 아래에서 위로 올라오며 교체된다.
 */
export default function BlockHeightCounter({value}: {value: number | null}) {
    // 이전 값을 함께 들고 있어야 어느 자리가 바뀌었는지 렌더 중에 판단할 수 있다
    const [frame, setFrame] = useState<{current: number; previous: number | null} | null>(null)
    // 최초 카운트업 중에는 값이 매 프레임 바뀌므로 자리별 연출을 걸지 않는다
    const [isLive, setIsLive] = useState(false)
    const hasAnimated = useRef(false)
    const frameRef = useRef<number | null>(null)

    useEffect(() => {
        if (value === null) { return }

        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        const animate = !hasAnimated.current && !prefersReducedMotion
        const duration = animate ? DURATION : 0

        hasAnimated.current = true

        const start = performance.now()

        // 갱신 값은 duration 0으로 한 프레임 만에 최종값에 도달한다
        const step = (now: number) => {
            const progress = duration === 0 ? 1 : Math.min((now - start) / duration, 1)
            const next = Math.round(value * easeOut(progress))
            setFrame((prev) => (
                prev?.current === next ? prev : {current: next, previous: prev?.current ?? null}
            ))

            if (progress < 1) {
                frameRef.current = requestAnimationFrame(step)
                return
            }

            setIsLive(true)
        }

        frameRef.current = requestAnimationFrame(step)

        return () => {
            if (frameRef.current !== null) { cancelAnimationFrame(frameRef.current) }
        }
    }, [value])

    const text = frame === null ? "-" : frame.current.toLocaleString()
    const prevText = frame?.previous != null ? frame.previous.toLocaleString() : null

    // 자리수가 늘어나도 어긋나지 않도록 오른쪽 끝을 기준으로 이전 값과 비교한다
    const hasChanged = (indexFromRight: number, char: string) => {
        if (!isLive || prevText === null) { return false }
        return prevText[prevText.length - 1 - indexFromRight] !== char
    }

    return (
        <p
            className={`flex text-4xl font-medium tabular-nums text-main transition-opacity duration-700 ease-out ${
                frame === null ? "opacity-0" : "opacity-100"
            }`}
        >
            {text.split("").map((char, index) => {
                const indexFromRight = text.length - 1 - index
                const changed = hasChanged(indexFromRight, char)

                return (
                    <span key={indexFromRight} className="overflow-hidden">
                        <span
                            // 바뀐 자리만 remount 시켜 그 자리에서만 애니메이션이 재생된다
                            key={changed ? char : "static"}
                            className={`block ${changed ? "block-height-rise" : ""}`}
                        >
                            {char}
                        </span>
                    </span>
                )
            })}
        </p>
    )
}
