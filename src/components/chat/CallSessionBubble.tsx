"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { MdCall, MdCallEnd, MdVideocam, MdMic, MdMicOff, MdOpenInFull } from "react-icons/md"
import { useAuthStore } from "@/src/store/authStore"
import { useCallStore } from "@/src/store/callStore"
import { toRelativeUrl } from "@/src/lib/file"

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

// 이 방에서 진행 중인 통화를 대화 흐름 안에 띄운다.
//
// 건 사람에게도 받는 사람에게도 똑같이 보이고, 아직 통화 화면에 들어가 있지 않은 쪽은
// 이걸 눌러서 들어간다(받는 쪽은 수락, 건 쪽은 전체화면 열기).
// 실제 메시지가 아니라 지금 살아 있는 통화라, 끊기면 사라지고 그 자리에
// [통화] 기록 말풍선이 남는다.
export default function CallSessionBubble({
  peerName,
  peerImageUrl,
  isSent,
}: {
  peerName: string
  peerImageUrl?: string | null
  // 내가 건 전화인지. 보낸 말풍선처럼 오른쪽에 붙일지 가른다.
  isSent: boolean
}) {
  const token = useAuthStore((s) => s.accessToken)
  const phase = useCallStore((s) => s.phase)
  const call = useCallStore((s) => s.call)
  const micOn = useCallStore((s) => s.micOn)
  const activeSince = useCallStore((s) => s.activeSince)
  const accept = useCallStore((s) => s.accept)
  const hangUp = useCallStore((s) => s.hangUp)
  const toggleMic = useCallStore((s) => s.toggleMic)
  const setExpanded = useCallStore((s) => s.setExpanded)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (phase !== "active") return
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [phase])

  const isVideo = call?.callType === "VIDEO"
  const incoming = phase === "incoming"
  const avatar = peerImageUrl ? toRelativeUrl(peerImageUrl) : "/profile.png"
  const elapsed = activeSince ? Math.max(0, Math.floor((now - activeSince) / 1000)) : 0

  const title = incoming
    ? `${isVideo ? "영상 통화" : "음성 통화"} 요청`
    : phase === "active"
      ? isVideo
        ? "영상 통화 중"
        : "음성 통화 중"
      : `${isVideo ? "영상 통화" : "음성 통화"} 연결 중`

  const subtitle = incoming
    ? `${peerName}님이 전화를 걸었어요`
    : phase === "active"
      ? formatDuration(elapsed)
      : "상대방을 기다리는 중"

  // 아직 통화 화면에 안 들어간 쪽이 누르는 자리.
  // 받는 쪽은 수락, 이미 통화 중인 쪽은 전체화면을 연다.
  const enter = () => {
    if (incoming) {
      if (token) accept(token)
      return
    }
    setExpanded(true)
  }

  const card = (
    <div
      className={`flex flex-col gap-3 rounded-2xl px-4 py-3 max-w-xs ${
        isSent ? "bg-main/10 rounded-br-none" : "bg-zinc-100 rounded-bl-none"
      }`}
    >
      {/* 카드 본문을 눌러도 들어가진다. 전화가 왔을 때 제일 자연스러운 동작은
          "그 알림을 누르는 것"이라, 버튼까지 조준하게 만들지 않는다. */}
      <button type="button" onClick={enter} className="flex items-center gap-2.5 text-left">
        <span className="flex items-center justify-center size-8 shrink-0 rounded-full bg-main text-base text-white">
          {isVideo ? <MdVideocam /> : <MdCall />}
        </span>
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-sm font-medium">{title}</span>
          <span className="text-xs text-zinc-400 tabular-nums truncate">{subtitle}</span>
        </div>
        {!incoming && <MdOpenInFull className="text-sm text-zinc-400 shrink-0" />}
      </button>

      <div className="flex items-center gap-2">
        {incoming ? (
          <>
            <button
              type="button"
              onClick={() => token && accept(token)}
              className="flex items-center justify-center gap-1.5 flex-1 rounded-xl bg-emerald-500 px-3 py-2 text-[13px] font-semibold text-white transition hover:bg-emerald-600"
            >
              <MdCall className="text-base" />
              받기
            </button>
            <button
              type="button"
              onClick={() => token && hangUp(token)}
              className="flex items-center justify-center gap-1.5 flex-1 rounded-xl bg-white px-3 py-2 text-[13px] font-semibold text-zinc-600 ring-1 ring-zinc-200 transition hover:bg-zinc-50"
            >
              <MdCallEnd className="text-base" />
              거절
            </button>
          </>
        ) : (
          <>
            {phase === "active" && (
              <button
                type="button"
                onClick={() => token && toggleMic(token)}
                aria-label={micOn ? "마이크 끄기" : "마이크 켜기"}
                className={`flex items-center justify-center size-9 shrink-0 rounded-xl text-base transition ${
                  micOn
                    ? "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50"
                    : "bg-zinc-800 text-white hover:bg-zinc-700"
                }`}
              >
                {micOn ? <MdMic /> : <MdMicOff />}
              </button>
            )}
            <button
              type="button"
              onClick={() => token && hangUp(token)}
              className="flex items-center justify-center gap-1.5 flex-1 rounded-xl bg-red-500 px-3 py-2 text-[13px] font-semibold text-white transition hover:bg-red-600"
            >
              <MdCallEnd className="text-base" />
              {phase === "active" ? "종료" : "취소"}
            </button>
          </>
        )}
      </div>
    </div>
  )

  if (isSent) return <div className="animate-chat-card flex justify-end">{card}</div>

  return (
    <div className="animate-chat-card flex items-end gap-3">
      <div className="relative flex items-center justify-center shrink-0">
        {incoming && <span className="absolute size-9 rounded-full bg-main/30 animate-call-pulse" />}
        <Image
          src={avatar}
          alt=""
          width={36}
          height={36}
          className="relative size-9 rounded-full object-cover"
        />
      </div>
      {card}
    </div>
  )
}
