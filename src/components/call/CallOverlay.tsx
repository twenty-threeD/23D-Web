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
  MdCameraswitch,
} from "react-icons/md"
import { useAuthStore } from "@/src/store/authStore"
import { useCallStore } from "@/src/store/callStore"
import { callEngine, canSelectPlaybackDevice, canShareScreen } from "@/src/lib/agoraEngine"
import type { ILocalVideoTrack, IRemoteVideoTrack } from "agora-rtc-sdk-ng"
import { useSpeaking } from "@/src/hooks/useSpeaking"
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
    peerReconnecting,
    expanded,
    setExpanded,
    accept,
    hangUp,
    toggleMic,
    toggleCam,
    toggleScreen,
    cameraFacing,
    canFlipCamera,
    flipCamera,
  } = useCallStore()
  // 통화 시간은 상태로 들고 있지 않고 activeSince 와의 차이로 계산한다.
  // 여기서는 화면을 다시 그릴 계기(now)만 1초마다 만든다.
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (phase !== "active") return
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [phase])

  const speaking = useSpeaking(phase === "active")
  // 작은 창의 가로/세로 비율. 휴대폰은 세로로 찍는 경우가 많아 16:9 칸에 넣으면 대부분 잘린다
  const [pipAspect, setPipAspect] = useState<Record<string, number>>({})
  // 작은 창을 눌러 크게 본 영상. 없으면 기본 순서(화면공유 → 상대 카메라 → 내 카메라)로 고른다
  const [focusKey, setFocusKey] = useState<string | null>(null)

  // 벨이 울리는 것만으로 화면을 덮지 않는다. 평소에는 우하단 도크(CallDock)가 맡고,
  // 영상·화면공유가 붙거나 사용자가 크게 보기를 누르면 여기로 넘어온다.
  if (phase === "idle" || !expanded) return null

  // 발신 버튼을 누른 직후에는 아직 call 응답이 없다. 그 몇 초 동안 화면이 비면
  // 버튼이 안 먹은 것처럼 보이므로, 채팅방에서 미리 받아둔 이름·사진으로 먼저 그린다.
  const peer = call ? participantsOf(call, myUsername).peer : null
  const peerName = peer?.name ?? peerNameHint ?? "상대방"
  const elapsed = activeSince ? Math.max(0, Math.floor((now - activeSince) / 1000)) : 0
  const avatar = peerImageUrl ? toRelativeUrl(peerImageUrl) : "/profile.webp"
  const ringing = phase === "incoming" || phase === "outgoing" || phase === "connecting"

  const localCam = camOn ? callEngine.localCameraTrack : null
  const localScreen = screenOn ? callEngine.localScreenTrack : null
  const mainScreen = remoteScreenTrack ?? localScreen
  // 앞 카메라만 거울처럼 뒤집는다. 뒤 카메라까지 뒤집으면 글자·방향이 반대로 보인다
  const mirrorLocal = cameraFacing === "user"

  // 지금 띄울 수 있는 영상들. 기본은 화면공유가 주인공이고, 없으면 상대 카메라, 그것도 없으면 내 카메라를 크게 띄운다.
  // 작은 창을 누르면 그 영상이 큰 화면으로 올라가고 원래 큰 화면은 작은 창으로 내려간다
  type Tile = { key: string; track: ILocalVideoTrack | IRemoteVideoTrack; label: string; mirrored: boolean; screen: boolean }
  const tiles: Tile[] = []
  if (mainScreen) tiles.push({ key: "screen", track: mainScreen, label: "화면 공유", mirrored: false, screen: true })
  if (remoteCamTrack) tiles.push({ key: "peer", track: remoteCamTrack, label: peerName, mirrored: false, screen: false })
  if (localCam) tiles.push({ key: "me", track: localCam, label: "나", mirrored: mirrorLocal, screen: false })
  // 누른 영상이 사라지면(상대가 카메라를 끔 등) 기본 순서로 돌아간다
  const mainTile = tiles.find((tile) => tile.key === focusKey) ?? tiles[0] ?? null
  const mainTrack = mainTile?.track ?? null
  const pips = tiles.filter((tile) => tile !== mainTile)
  // 말하는 사람의 영상·프로필에 주황 링을 두른다
  const isSpeaking = (track: unknown) =>
    (track === remoteCamTrack && speaking.peer) || (track === localCam && speaking.me)

  const statusText =
    phase === "incoming"
      ? call?.callType === "VIDEO" ? "영상 통화 요청" : "음성 통화 요청"
      : phase === "connecting"
        ? "연결하는 중"
        : phase === "outgoing"
          ? "상대방을 기다리는 중"
          : peerReconnecting
            ? "상대방 연결을 기다리는 중"
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
        <div className="flex items-start justify-between gap-4 px-5 md:px-8 pt-6 shrink-0">
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
        <div className="relative flex flex-1 min-h-0 items-center justify-center px-4 md:px-8 py-6">
          {mainTrack ? (
            <div className="relative w-full h-full">
              {/* 가로로 찍은 영상과 세로로 찍은 영상이 섞여 오므로 큰 화면은 자르지 않고(contain) 전부 보여준다 */}
              <VideoTile
                track={mainTrack}
                fit="contain"
                mirrored={mainTile?.mirrored ?? false}
                className={`w-full h-full rounded-3xl overflow-hidden bg-black/50 transition-shadow ${isSpeaking(mainTrack) ? "ring-4 ring-main" : "ring-1 ring-white/10"}`}
              />
              {pips.length > 0 && (
                <div className="absolute right-4 top-4 flex flex-col items-end gap-3">
                  {pips.map((pip) => {
                    const aspect = pipAspect[pip.key] ?? 16 / 9
                    return (
                    <button
                      type="button"
                      key={pip.key}
                      onClick={() => setFocusKey(pip.key)}
                      aria-label={`${pip.label} 크게 보기`}
                      style={{ aspectRatio: aspect }}
                      className={`relative ${aspect < 1 ? "w-24 md:w-28" : "w-36 md:w-44"} rounded-2xl overflow-hidden bg-black/60 cursor-pointer transition-shadow ${isSpeaking(pip.track) ? "ring-[3px] ring-main" : "ring-1 ring-white/15"}`}
                    >
                      <VideoTile
                        track={pip.track}
                        fit={pip.screen ? "contain" : "cover"}
                        mirrored={pip.mirrored}
                        className="w-full h-full"
                        onAspect={(ratio) =>
                          setPipAspect((prev) => (Math.abs((prev[pip.key] ?? 0) - ratio) < 0.01 ? prev : { ...prev, [pip.key]: ratio }))
                        }
                      />
                      <span className="absolute left-2 bottom-2 px-2 py-0.5 rounded-md bg-black/50 text-[11px]">
                        {pip.label}
                      </span>
                    </button>
                    )
                  })}
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
                  className={`relative w-32 h-32 rounded-full object-cover transition-shadow ring-4 ${speaking.peer ? "ring-main" : "ring-white/15"}`}
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
        <div className="flex items-end justify-center gap-3 md:gap-4 px-4 md:px-8 pb-8 md:pb-10 shrink-0">
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
                highlight={micOn && speaking.me}
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

              {/* 휴대폰처럼 카메라가 앞뒤로 있는 기기에서만, 카메라를 켰을 때 보인다 */}
              {camOn && canFlipCamera && (
                <CallButton label="카메라 전환" disabled={busy} onClick={() => void flipCamera()}>
                  <MdCameraswitch />
                </CallButton>
              )}

              {/* 휴대폰 브라우저는 화면공유 API 가 없어 눌러도 실패만 해서 지원하는 환경에서만 보여준다 */}
              {canShareScreen() && (
              <CallButton
                label="화면 공유"
                tone={screenOn ? "on" : "normal"}
                disabled={!call || busy || (!!peer?.screenSharing && !screenOn)}
                onClick={() => token && toggleScreen(token)}
              >
                {screenOn ? <MdStopScreenShare /> : <MdScreenShare />}
              </CallButton>
              )}

              {/* 소리 나는 곳은 데스크톱 크롬 계열에서만 바꿀 수 있다. 휴대폰은 OS 가 스피커·수화부를 정한다 */}
              {canSelectPlaybackDevice() && <SpeakerButton />}
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
