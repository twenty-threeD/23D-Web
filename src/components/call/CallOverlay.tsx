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
  MdCloseFullscreen,
} from "react-icons/md"
import { useAuthStore } from "@/src/store/authStore"
import { useCallStore } from "@/src/store/callStore"
import { callEngine } from "@/src/lib/agoraEngine"
import { participantsOf } from "@/src/lib/call"
import { toRelativeUrl } from "@/src/lib/file"
import VideoTile from "./VideoTile"
import CallButton from "./CallButton"
import SpeakerButton from "./SpeakerButton"

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export default function CallOverlay() {
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
    remoteCamTrack,
    remoteScreenTrack,
    activeSince,
    expanded,
    setExpanded,
    accept,
    hangUp,
    toggleMic,
    toggleCam,
    toggleScreen,
  } = useCallStore()
  // 통화 시간은 상태로 들고 있지 않고 activeSince 와의 차이로 계산한다.
  // 여기서는 화면을 다시 그릴 계기(now)만 1초마다 만든다.
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (phase !== "active") return
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [phase])

  // 벨이 울리는 것만으로 화면을 덮지 않는다. 평소에는 우하단 도크(CallDock)가 맡고,
  // 영상·화면공유가 붙거나 사용자가 크게 보기를 누르면 여기로 넘어온다.
  if (phase === "idle" || !expanded) return null

  // 발신 버튼을 누른 직후에는 아직 call 응답이 없다. 그 몇 초 동안 화면이 비면
  // 버튼이 안 먹은 것처럼 보이므로, 채팅방에서 미리 받아둔 이름·사진으로 먼저 그린다.
  const peer = call ? participantsOf(call, myUsername).peer : null
  const peerName = peer?.name ?? peerNameHint ?? "상대방"
  const elapsed = activeSince ? Math.max(0, Math.floor((now - activeSince) / 1000)) : 0
  const avatar = peerImageUrl ? toRelativeUrl(peerImageUrl) : "/profile.png"
  const ringing = phase === "incoming" || phase === "outgoing" || phase === "connecting"

  const localCam = camOn ? callEngine.localCameraTrack : null
  const localScreen = screenOn ? callEngine.localScreenTrack : null
  // 화면공유가 있으면 그게 주인공이고, 없으면 상대 카메라, 그것도 없으면 내 카메라를 크게 띄운다.
  const mainScreen = remoteScreenTrack ?? localScreen
  const mainTrack = mainScreen ?? remoteCamTrack ?? localCam

  const pips: { key: string; track: NonNullable<typeof localCam> | NonNullable<typeof remoteCamTrack>; label: string; mirrored?: boolean }[] = []
  if (mainScreen && remoteCamTrack) pips.push({ key: "peer", track: remoteCamTrack, label: peerName })
  if (localCam && mainTrack !== localCam) pips.push({ key: "me", track: localCam, label: "나", mirrored: true })

  const statusText =
    phase === "incoming"
      ? call?.callType === "VIDEO" ? "영상 통화 요청" : "음성 통화 요청"
      : phase === "connecting"
        ? "연결하는 중"
        : phase === "outgoing"
          ? "상대방을 기다리는 중"
          : formatDuration(elapsed)

  return (
    <div className="fixed inset-0 z-[120] flex flex-col text-white">
      {/* 배경: 상대 프로필을 크게 흐려 깔고 브랜드 컬러 글로우를 얹는다 */}
      <div aria-hidden className="absolute inset-0 overflow-hidden bg-[#0d0c11]">
        <Image src={avatar} alt="" fill sizes="100vw" className="object-cover opacity-40 blur-3xl scale-125" />
        <div className="absolute inset-0 bg-[#0d0c11]/70" />
        <div className="absolute left-1/2 -translate-x-1/2 -top-[30vw] w-[80vw] h-[80vw] rounded-full bg-main/20 blur-[140px]" />
      </div>

      <div className="relative flex flex-col flex-1 min-h-0">
        {/* 상단 바 */}
        <div className="flex items-start justify-between gap-4 px-8 pt-6 shrink-0">
          <div className="flex flex-col gap-1">
            {mainTrack && (
              <>
                <p className="text-lg font-semibold">{peerName}</p>
                <p className="text-xs text-white/50 tabular-nums">{statusText}</p>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* 영상을 보면서도 다른 화면을 봐야 할 때가 있다. 통화는 끊지 않고 도크로 내린다 */}
            <button
              type="button"
              onClick={() => setExpanded(false)}
              aria-label="작게 보기"
              title="작게 보기"
              className="flex items-center justify-center size-9 rounded-full text-base text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <MdCloseFullscreen />
            </button>
            {phase === "active" && peer && !peer.audioEnabled && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 text-xs text-white/70">
                <MdMicOff className="text-sm" />
                음소거됨
              </span>
            )}
            {peer?.screenSharing && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-main/90 text-xs">
                <MdScreenShare className="text-sm" />
                화면 공유 중
              </span>
            )}
          </div>
        </div>

        {/* 스테이지 */}
        <div className="relative flex flex-1 min-h-0 items-center justify-center px-8 py-6">
          {mainTrack ? (
            <div className="relative w-full h-full">
              <VideoTile
                track={mainTrack}
                fit={mainScreen ? "contain" : "cover"}
                mirrored={!mainScreen && mainTrack === localCam}
                className="w-full h-full rounded-3xl overflow-hidden bg-black/50 ring-1 ring-white/10"
              />
              {pips.length > 0 && (
                <div className="absolute right-4 top-4 flex flex-col gap-3 w-44">
                  {pips.map((pip) => (
                    <div
                      key={pip.key}
                      className="relative aspect-video rounded-2xl overflow-hidden bg-black/60 ring-1 ring-white/15"
                    >
                      <VideoTile track={pip.track} fit="cover" mirrored={pip.mirrored} className="w-full h-full" />
                      <span className="absolute left-2 bottom-2 px-2 py-0.5 rounded-md bg-black/50 text-[11px]">
                        {pip.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-7">
              <div className="relative flex items-center justify-center">
                {ringing && (
                  <>
                    <span className="absolute w-32 h-32 rounded-full bg-white/25 animate-call-pulse" />
                    <span className="absolute w-32 h-32 rounded-full bg-white/25 animate-call-pulse [animation-delay:0.8s]" />
                  </>
                )}
                <Image
                  src={avatar}
                  alt={peerName}
                  width={128}
                  height={128}
                  className="relative w-32 h-32 rounded-full object-cover ring-4 ring-white/15"
                />
              </div>
              <div className="flex flex-col items-center gap-2">
                <p className="text-2xl font-semibold">{peerName}</p>
                <p className="text-sm text-white/55 tabular-nums">{statusText}</p>
              </div>
            </div>
          )}
        </div>

        {/* 컨트롤 */}
        <div className="flex items-end justify-center gap-4 px-8 pb-10 shrink-0">
          {phase === "incoming" ? (
            <>
              <CallButton label="거절" tone="danger" onClick={() => token && hangUp(token)}>
                <MdCallEnd />
              </CallButton>
              <CallButton label="수락" tone="accept" onClick={() => token && accept(token)}>
                {call?.callType === "VIDEO" ? <MdVideocam /> : <MdCall />}
              </CallButton>
            </>
          ) : (
            <>
              <CallButton
                label={micOn ? "마이크" : "음소거"}
                tone={micOn ? "normal" : "off"}
                disabled={!call}
                onClick={() => token && toggleMic(token)}
              >
                {micOn ? <MdMic /> : <MdMicOff />}
              </CallButton>

              {/* 음성으로 걸었어도 여기서 그냥 켜진다. 토큰에 영상 권한이 이미 들어 있다. */}
              <CallButton
                label="카메라"
                tone={camOn ? "normal" : "off"}
                disabled={!call || busy}
                onClick={() => token && toggleCam(token)}
              >
                {camOn ? <MdVideocam /> : <MdVideocamOff />}
              </CallButton>

              <CallButton
                label="화면 공유"
                tone={screenOn ? "on" : "normal"}
                disabled={!call || busy || (!!peer?.screenSharing && !screenOn)}
                onClick={() => token && toggleScreen(token)}
              >
                {screenOn ? <MdStopScreenShare /> : <MdScreenShare />}
              </CallButton>

              <SpeakerButton />
              <CallButton label="종료" tone="danger" onClick={() => token && hangUp(token)}>
                <MdCallEnd />
              </CallButton>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
