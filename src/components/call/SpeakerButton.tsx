"use client"

import { useEffect, useRef, useState } from "react"
import { MdVolumeUp, MdBluetoothAudio, MdSpeaker, MdHeadphones } from "react-icons/md"
import { useCallStore } from "@/src/store/callStore"
import { useToast } from "@/src/hooks/useToast"
import CallButton from "./CallButton"

// 장치 이름만 보고 아이콘을 고른다. 브라우저가 종류(스피커/블루투스)를 따로 알려주지 않는다.
function DeviceIcon({ label }: { label?: string }) {
  if (!label) return <MdVolumeUp />
  if (/bluetooth|airpod|buds|헤드셋|블루투스/i.test(label)) return <MdBluetoothAudio />
  if (/speaker|스피커|내장/i.test(label)) return <MdSpeaker />
  return <MdHeadphones />
}

// 소리가 나갈 곳(스피커폰·블루투스·헤드셋)을 고르는 버튼.
// setSinkId 기반이라 크롬 계열 데스크톱에서만 목록이 채워진다.
export default function SpeakerButton({ size = "md" }: { size?: "md" | "sm" }) {
  const devices = useCallStore((s) => s.devices)
  const deviceId = useCallStore((s) => s.deviceId)
  const selectDevice = useCallStore((s) => s.selectDevice)
  const { addToast } = useToast()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [open])

  const selectedLabel = devices.find((d) => d.deviceId === deviceId)?.label

  return (
    <div className="relative flex" ref={ref}>
      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 flex flex-col gap-1 w-60 p-2 rounded-2xl bg-zinc-900/95 ring-1 ring-white/10 backdrop-blur">
          <p className="px-3 py-1.5 text-[11px] text-white/40">소리 나는 곳</p>
          {devices.map((d) => (
            <button
              key={d.deviceId}
              type="button"
              onClick={() => {
                void selectDevice(d.deviceId)
                setOpen(false)
              }}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs transition ${
                d.deviceId === deviceId ? "bg-main text-white" : "text-white/80 hover:bg-white/10"
              }`}
            >
              <span className="flex text-base shrink-0">
                <DeviceIcon label={d.label} />
              </span>
              <span className="truncate">{d.label}</span>
            </button>
          ))}
        </div>
      )}
      <CallButton
        label="소리"
        size={size}
        showLabel={size === "md"}
        onClick={() => {
          if (devices.length === 0) {
            addToast({ message: "이 브라우저에서는 오디오 출력 장치를 바꿀 수 없어요.", type: "error" })
            return
          }
          setOpen((v) => !v)
        }}
      >
        <DeviceIcon label={selectedLabel} />
      </CallButton>
    </div>
  )
}
