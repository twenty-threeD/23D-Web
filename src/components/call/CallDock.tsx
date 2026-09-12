"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import {
  MdMic,
  MdMicOff,
  MdVideocam,
  MdVideocamOff,
  MdScreenShare,
  MdStopScreenShare,
  MdCallEnd,
  MdCall,
  MdOpenInFull,
} from "react-icons/md"
import { useAuthStore } from "@/src/store/authStore"
import { useCallStore } from "@/src/store/callStore"
import { useChatRoomsStore } from "@/src/store/chatRoomsStore"
import { participantsOf } from "@/src/lib/call"
import { toRelativeUrl } from "@/src/lib/file"
import CallButton from "./CallButton"
import { useDraggable } from "@/src/hooks/useDraggable"
import SpeakerButton from "./SpeakerButton"

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

// 통화의 기본 자리. 인스타 웹 DM 처럼 오른쪽 아래에 작게 떠서
// 벨이 울리는 동안에도 하던 작업을 가리지 않는다.
// 영상·화면공유가 붙으면 그때 전체화면(CallOverlay)으로 넘어간다.
export default function CallDock() {
  const token = useAuthStore((s) => s.accessToken)
  const {
    phase,
    call,
    myUsername,
    peerNameHint,
    peerImageUrl,
    micOn,
    camOn,
    screenOn,
    busy,
    expanded,
    activeSince,
    setExpanded,
    accept,
    hangUp,
    toggleMic,
    toggleCam,
    toggleScreen,
  } = useCallStore()
  const [now, setNow] = useState(() => Date.now())
  // 그 방을 열어두고 있으면 대화 흐름 안의 카드가 대신 맡는다
  const activeRoomId = useChatRoomsStore((s) => s.activeRoomId)
  const { ref, style, handleProps } = useDraggable("call-dock-position")

  useEffect(() => {
    if (phase !== "active") return
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [phase])

  // 전체화면이 떠 있으면 도크는 숨는다. 같은 통화가 두 군데 보이면 헷갈린다.
  if (phase === "idle" || expanded) return null
  // 그 채팅방을 보고 있으면 대화 흐름 안의 카드가 통화를 맡는다. 둘 다 띄우면 중복이다.
  if (call && activeRoomId === call.roomId) return null

  const peer = call ? participantsOf(call, myUsername).peer : null
  const peerName = peer?.name ?? peerNameHint ?? "상대방"
  const avatar = peerImageUrl ? toRelativeUrl(peerImageUrl) : "/profile.png"
  const elapsed = activeSince ? Math.max(0, Math.floor((now - activeSince) / 1000)) : 0
  const incoming = phase === "incoming"

  const statusText = incoming
    ? call?.callType === "VIDEO"
      ? "영상 통화 요청"
      : "음성 통화 요청"
    : phase === "connecting"
      ? "연결하는 중"
      : phase === "outgoing"
        ? "상대방을 기다리는 중"
        : formatDuration(elapsed)

  return (
    <div
      ref={ref}
      style={style}
      className="fixed right-6 bottom-6 z-[110] flex flex-col gap-4 w-80 p-5 rounded-2xl bg-[#17161c] text-white shadow-2xl ring-1 ring-white/10"
    >
      {/* 프로필·이름 줄이 드래그 손잡이다. 버튼 위에서 끌면 클릭과 헷갈리므로 여기만 잡는다.
          touch-none 이 없으면 터치로 끌 때 브라우저 스크롤이 먼저 먹는다. */}
      <div className="flex items-center gap-3 cursor-grab active:cursor-grabbing touch-none" {...handleProps}>
        <div className="relative flex items-center justify-center shrink-0">
          {incoming && (
            <span className="absolute size-12 rounded-full bg-white/20 animate-call-pulse" />
          )}
          <Image
            src={avatar}
            alt={peerName}
            width={48}
            height={48}
            className="relative size-12 rounded-full object-cover ring-2 ring-white/15"
          />
        </div>
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{peerName}</p>
          <p className="text-xs text-white/50 tabular-nums">{statusText}</p>
        </div>
        {/* 걸려온 전화만 빼고 언제나 키울 수 있어야 한다.
            예전에는 통화 중일 때만 버튼이 있어서, 발신 대기 중에 축소하면 되돌릴 길이 없었다. */}
        {!incoming && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            aria-label="크게 보기"
            title="크게 보기"
            className="flex items-center justify-center size-8 shrink-0 rounded-full text-base text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <MdOpenInFull />
          </button>
        )}
      </div>

      <div className="flex items-center justify-center gap-3">
        {incoming ? (
          <>
            <CallButton
              label="거절"
              tone="danger"
              size="sm"
              showLabel={false}
              onClick={() => token && hangUp(token)}
            >
              <MdCallEnd />
            </CallButton>
            <CallButton
              label="받기"
              tone="accept"
              size="sm"
              showLabel={false}
              onClick={() => token && accept(token)}
            >
              {call?.callType === "VIDEO" ? <MdVideocam /> : <MdCall />}
            </CallButton>
          </>
        ) : (
          <>
            <CallButton
              label={micOn ? "마이크" : "음소거"}
              tone={micOn ? "normal" : "off"}
              size="sm"
              showLabel={false}
              disabled={!call}
              onClick={() => token && toggleMic(token)}
            >
              {micOn ? <MdMic /> : <MdMicOff />}
            </CallButton>
            <CallButton
              label="카메라"
              tone={camOn ? "normal" : "off"}
              size="sm"
              showLabel={false}
              disabled={!call || busy}
              onClick={() => token && toggleCam(token)}
            >
              {camOn ? <MdVideocam /> : <MdVideocamOff />}
            </CallButton>
            <CallButton
              label="화면 공유"
              tone={screenOn ? "on" : "normal"}
              size="sm"
              showLabel={false}
              disabled={!call || busy || (!!peer?.screenSharing && !screenOn)}
              onClick={() => token && toggleScreen(token)}
            >
              {screenOn ? <MdStopScreenShare /> : <MdScreenShare />}
            </CallButton>
            <SpeakerButton size="sm" />
            <CallButton
              label="종료"
              tone="danger"
              size="sm"
              showLabel={false}
              onClick={() => token && hangUp(token)}
            >
              <MdCallEnd />
            </CallButton>
          </>
        )}
      </div>
    </div>
  )
}
