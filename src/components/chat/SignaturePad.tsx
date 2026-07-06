"use client"

import { useRef } from "react"
import SignatureCanvas from "react-signature-canvas"

interface SignaturePadProps {
  label: string
  onSave: (dataUrl: string) => void
  savedUrl?: string
}

export default function SignaturePad({ label, onSave, savedUrl }: SignaturePadProps) {
  const ref = useRef<SignatureCanvas>(null)

  function handleSave() {
    if (!ref.current || ref.current.isEmpty()) return
    onSave(ref.current.toDataURL("image/png"))
  }

  function handleClear() {
    ref.current?.clear()
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
            className="text-xs text-zinc-400 underline cursor-pointer text-left"
          >
            다시 서명
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="border border-zinc-300 rounded-lg overflow-hidden bg-white">
            <SignatureCanvas
              ref={ref}
              canvasProps={{ width: 320, height: 128, className: "w-full" }}
              penColor="#1e293b"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleClear}
              className="flex-1 py-1 text-xs border border-zinc-300 rounded-md text-zinc-500 cursor-pointer hover:bg-zinc-50"
            >
              지우기
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-1 text-xs bg-main text-white rounded-md cursor-pointer hover:opacity-90"
            >
              서명 확인
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
