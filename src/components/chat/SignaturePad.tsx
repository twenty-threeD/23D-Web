"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import SignatureCanvas from "react-signature-canvas"

interface SignaturePadProps {
  label: string
  onSave: (dataUrl: string) => void
  savedUrl?: string
}

const CANVAS_HEIGHT = 140

export default function SignaturePad({ label, onSave, savedUrl }: SignaturePadProps) {
  const ref = useRef<SignatureCanvas>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [hasStroke, setHasStroke] = useState(false)

  // 캔버스의 실제 픽셀 크기를 표시 크기 × devicePixelRatio 로 맞춘다.
  // 이걸 안 하면 캔버스가 CSS로만 늘어나서 선이 뭉개지고, 커서 위치와 획이 어긋난다.
  const resizeCanvas = useCallback(() => {
    const pad = ref.current
    const wrap = wrapRef.current
    if (!pad || !wrap) return

    const canvas = pad.getCanvas()
    const ratio = Math.max(window.devicePixelRatio || 1, 1)
    const width = wrap.clientWidth
    if (!width) return

    // 크기를 바꾸면 캔버스 내용이 지워지므로 기존 획을 백업했다가 되돌린다.
    const previous = pad.isEmpty() ? null : pad.toDataURL()

    canvas.width = width * ratio
    canvas.height = CANVAS_HEIGHT * ratio
    canvas.style.width = `${width}px`
    canvas.style.height = `${CANVAS_HEIGHT}px`
    canvas.getContext("2d")?.scale(ratio, ratio)

    pad.clear()
    if (previous) pad.fromDataURL(previous, { width, height: CANVAS_HEIGHT })
  }, [])

  useEffect(() => {
    if (savedUrl) return
    resizeCanvas()
    const wrap = wrapRef.current
    if (!wrap) return
    const observer = new ResizeObserver(resizeCanvas)
    observer.observe(wrap)
    return () => observer.disconnect()
  }, [savedUrl, resizeCanvas])

  function handleSave() {
    if (!ref.current || ref.current.isEmpty()) return
    // 여백을 잘라내야 계약서에 얹었을 때 서명이 작게 보이지 않는다.
    onSave(ref.current.getTrimmedCanvas().toDataURL("image/png"))
  }

  function handleClear() {
    ref.current?.clear()
    setHasStroke(false)
    onSave("")
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-zinc-700">{label} 서명</span>
      {savedUrl ? (
        <div className="flex flex-col gap-2">
          <div className="border border-zinc-300 rounded-lg overflow-hidden w-full h-32 flex items-center justify-center bg-white">
            <img src={savedUrl} alt="서명" className="h-full object-contain" />
          </div>
          <button
            onClick={handleClear}
            className="text-xs text-zinc-400 hover:text-zinc-600 underline cursor-pointer text-left transition-colors"
          >
            다시 서명
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div ref={wrapRef} className="relative border border-zinc-300 rounded-lg overflow-hidden bg-white">
            <SignatureCanvas
              ref={ref}
              canvasProps={{ className: "block touch-none cursor-crosshair" }}
              penColor="#111827"
              // 기본값(throttle 16ms, minDistance 5)은 포인트를 많이 버려서 획이 각져 보인다.
              throttle={0}
              minDistance={1}
              velocityFilterWeight={0.7}
              minWidth={1}
              maxWidth={3}
              dotSize={1.5}
              onBegin={() => setHasStroke(true)}
            />
            {!hasStroke && (
              <span className="absolute bottom-2 left-0 right-0 text-center text-[11px] text-zinc-300 pointer-events-none select-none">
                이곳에 서명해주세요
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleClear}
              className="flex-1 py-1.5 text-xs border border-zinc-300 rounded-md text-zinc-500 cursor-pointer hover:bg-zinc-50 transition-colors"
            >
              지우기
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-1.5 text-xs bg-main text-white rounded-md cursor-pointer hover:bg-orange-600 transition-colors"
            >
              서명 확인
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
