"use client"
import {useEffect, useId, useRef, useState} from "react";

/**
 * 카드 제목 옆 '?' 도움말.
 *
 * title 속성으로 만든 브라우저 기본 툴팁은 지연이 길고 모양을 맞출 수 없어,
 * 카드와 같은 라운드·보더·타이포를 쓰는 말풍선을 직접 그린다.
 *
 * 마우스는 호버, 키보드는 포커스, 터치는 탭으로 열린다.
 * (터치 기기에는 호버가 없어 클릭 토글이 유일한 진입점이다)
 */
export default function HelpTooltip({title, children}: {title: string; children: string}) {
    const [open, setOpen] = useState(false)
    const wrapperRef = useRef<HTMLSpanElement>(null)
    const id = useId()

    // 탭으로 연 툴팁은 바깥을 누르거나 Esc로 닫는다
    useEffect(() => {
        if (!open) { return }

        const handlePointerDown = (event: PointerEvent) => {
            if (!wrapperRef.current?.contains(event.target as Node)) { setOpen(false) }
        }
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") { setOpen(false) }
        }

        document.addEventListener("pointerdown", handlePointerDown)
        document.addEventListener("keydown", handleKeyDown)

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown)
            document.removeEventListener("keydown", handleKeyDown)
        }
    }, [open])

    return (
        <span
            ref={wrapperRef}
            className="relative inline-flex"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
        >
            <button
                type="button"
                aria-label={`${title} 설명`}
                aria-expanded={open}
                aria-describedby={open ? id : undefined}
                onClick={() => setOpen((previous) => !previous)}
                onFocus={() => setOpen(true)}
                onBlur={() => setOpen(false)}
                className={`flex size-[18px] cursor-help items-center justify-center rounded-full border text-[11px] font-semibold leading-none transition-colors ${
                    open
                        ? "border-main bg-main text-white"
                        : "border-[#aaa] bg-white text-[#aaa]"
                }`}
            >
                ?
            </button>

            {open && (
                <span
                    role="tooltip"
                    id={id}
                    className="animate-help-tooltip absolute left-1/2 top-[calc(100%+10px)] z-20 flex w-[260px] -translate-x-1/2 flex-col gap-1.5 rounded-xl border border-[#aaa]/30 bg-white p-4 text-left shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
                >
                    {/* 말풍선 꼬리: 말풍선 보더와 같은 색이 보이도록 위·왼쪽 변만 남긴다 */}
                    <span
                        aria-hidden
                        className="absolute -top-[5px] left-1/2 size-[9px] -translate-x-1/2 rotate-45 border-l border-t border-[#aaa]/30 bg-white"
                    />
                    <span className="text-sm font-semibold text-black">{title}</span>
                    <span className="text-xs font-normal leading-[1.6] text-[#aaa]">{children}</span>
                </span>
            )}
        </span>
    )
}
