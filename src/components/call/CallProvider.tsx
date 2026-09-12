"use client"

import { useEffect, useRef } from "react"
import { Client } from "@stomp/stompjs"
import SockJS from "sockjs-client"
import { useAuthStore, setWsAuthCookie } from "@/src/store/authStore"
import { useChatRoomsStore } from "@/src/store/chatRoomsStore"
import { useCallStore } from "@/src/store/callStore"
import { callEngine } from "@/src/lib/agoraEngine"
import { playHangupTone, primeRingtone, startRingtone, stopRingtone } from "@/src/lib/ringtone"
import { useToast } from "@/src/hooks/useToast"
import type { CallSignalEvent } from "@/src/lib/call"
import CallOverlay from "./CallOverlay"
import CallDock from "./CallDock"

const CALL_DEBUG = process.env.NODE_ENV === "development"

// 벨이 울리기 시작하고 이만큼 지나면 스스로 끊는다.
// 서버도 60초에 MISSED 를 쏘므로 일부러 조금 늦게 잡아 서버 판정에 우선권을 준다.
// (서버 시그널이 오면 그쪽이 먼저 화면을 닫고, 안 오면 여기서 끊는다)
const NO_ANSWER_TIMEOUT_MS = 63_000

// 통화 시그널링은 채팅방과 달리 앱 어디에 있든 받아야 한다(걸려온 전화를 놓치면 안 된다).
// 채팅 페이지의 STOMP 연결은 방을 열었을 때만 살아 있고 방을 바꿀 때마다 끊겼다 붙으므로,
// 여기서 로그인 상태 동안 유지되는 연결을 따로 하나 잡고 /user/queue/call 만 구독한다.
export default function CallProvider() {
  const token = useAuthStore((s) => s.accessToken)
  // 갑/을 판별과 달리 여기서는 "통화에서 내가 어느 쪽인지"를 username 으로만 가른다.
  // 구버전 저장 상태에는 username 이 비어 있을 수 있어 채팅방과 같은 방식으로 토큰에서 꺼낸다.
  const username = useAuthStore((s) => {
    if (s.username) return s.username
    if (!s.accessToken) return null
    try {
      const p = JSON.parse(atob(s.accessToken.split(".")[1]))
      return p.username ?? p.sub ?? null
    } catch {
      return null
    }
  })
  const setMyUsername = useCallStore((s) => s.setMyUsername)
  const phase = useCallStore((s) => s.phase)
  const pendingLog = useCallStore((s) => s.pendingLog)
  const clearPendingLog = useCallStore((s) => s.clearPendingLog)
  const error = useCallStore((s) => s.error)
  const notice = useCallStore((s) => s.notice)
  const setError = useCallStore((s) => s.setError)
  const setNotice = useCallStore((s) => s.setNotice)
  const { addToast } = useToast()
  // 통화 기록을 보낼 때 재사용한다. 채팅 페이지의 연결은 방을 열었을 때만 살아 있다.
  const clientRef = useRef<Client | null>(null)
  // 엔진 콜백은 한 번만 등록하므로 최신 토큰을 ref 로 들고 본다
  const tokenRef = useRef(token)
  useEffect(() => {
    tokenRef.current = token
  }, [token])

  useEffect(() => {
    setMyUsername(username)
  }, [username, setMyUsername])

  useEffect(() => {
    callEngine.setHandlers({
      onRemoteVideo: (kind, track) => useCallStore.getState().setRemoteVideo(kind, track),
      onTokenExpiring: () => {
        const t = tokenRef.current
        if (t) void useCallStore.getState().renew(t)
      },
      onScreenEnded: () => {
        // 브라우저 기본 UI 의 "공유 중지" 버튼. 우리 버튼을 누른 것과 똑같이 처리해야
        // 서버 점유(screen-share)까지 같이 풀린다.
        const t = tokenRef.current
        if (t && useCallStore.getState().screenOn) void useCallStore.getState().toggleScreen(t)
      },
      onPeerLeft: () => {
        // 상대가 탭을 닫으면 서버 종료 신호 없이 채널에서만 사라질 수 있다.
        // 그대로 두면 아무도 없는 통화 화면이 남으므로 여기서 끊는다.
        const store = useCallStore.getState()
        if (store.phase === 'idle' || store.phase === 'incoming') return
        store.setNotice('상대방과의 연결이 끊어졌어요.')
        const t = tokenRef.current
        if (t) void store.hangUp(t)
        else void store.reset()
      },
      onError: (message) => useCallStore.getState().setError(message),
    })
  }, [])

  // 알림과 벨소리는 통화 화면이 떠 있는지와 무관하게 울려야 한다.
  // (우하단 도크로 내려가 있거나 전체화면이 닫혀 있어도 마찬가지라 여기서 맡는다)
  useEffect(() => {
    if (!error) return
    addToast({ message: error, type: "error" })
    setError(null)
  }, [error, addToast, setError])

  useEffect(() => {
    if (!notice) return
    addToast({ message: notice, type: "info" })
    setNotice(null)
  }, [notice, addToast, setNotice])

  // 마이크 권한이 잡힌 뒤에야 출력 장치 이름이 채워진다. 통화가 붙은 시점에 한 번 읽는다.
  // 도크와 전체화면이 같은 목록을 쓰므로 화면이 아니라 여기서 채운다.
  useEffect(() => {
    if (phase === "active") void useCallStore.getState().refreshDevices()
  }, [phase])

  // 브라우저는 사용자가 페이지를 건드리기 전에 나는 소리를 막는다.
  // 전화가 왔을 때 오디오를 처음 만들면 이미 늦어서 벨이 안 울리므로,
  // 첫 클릭·키입력 때 미리 깨워둔다.
  // 종료음은 통화를 끊어봐야 들을 수 있어서 손보기가 번거롭다.
  // 개발 중에는 콘솔에서 __hangupTone() 으로 바로 들어볼 수 있게 열어둔다.
  useEffect(() => {
    if (!CALL_DEBUG) return
    ;(window as unknown as Record<string, unknown>).__hangupTone = playHangupTone
  }, [])

  useEffect(() => {
    const unlock = () => primeRingtone()
    window.addEventListener("pointerdown", unlock, { once: true })
    window.addEventListener("keydown", unlock, { once: true })
    return () => {
      window.removeEventListener("pointerdown", unlock)
      window.removeEventListener("keydown", unlock)
    }
  }, [])

  // 전화가 온 걸 화면만으로는 알기 어렵다. 벨이 울리는 동안만 소리를 낸다.
  useEffect(() => {
    if (phase !== "incoming") return
    startRingtone()
    return () => stopRingtone()
  }, [phase])

  // 통화가 끝나면 종료음을 낸다. 화면이 닫히는 것만으로는 끊긴 걸 놓치기 쉽다.
  // 직접 끊었든 상대가 끊었든 부재중으로 흘렀든 끝은 끝이라 똑같이 울린다.
  const prevPhase = useRef(phase)
  useEffect(() => {
    if (prevPhase.current !== "idle" && phase === "idle") playHangupTone()
    prevPhase.current = phase
  }, [phase])

  // 아무도 받지 않는 전화가 영원히 울리지 않게 한다.
  // 서버 MISSED 가 안 오는 경우(시그널링이 끊겼을 때)의 마지막 방어선이기도 하다.
  useEffect(() => {
    if (phase !== "outgoing" && phase !== "incoming") return
    const id = setTimeout(() => {
      const store = useCallStore.getState()
      if (store.phase !== "outgoing" && store.phase !== "incoming") return
      store.setNotice(
        store.phase === "incoming" ? "부재중 전화가 있어요." : "상대방이 받지 않았어요."
      )
      const t = tokenRef.current
      if (t) void store.hangUp(t)
      else void store.reset()
    }, NO_ANSWER_TIMEOUT_MS)
    return () => clearTimeout(id)
  }, [phase])

  // 탭을 닫을 때 최소한 마이크·카메라는 놓아준다. 서버 쪽 종료는 상대가 나가면 정리된다.
  useEffect(() => {
    const onUnload = () => {
      void callEngine.leave()
    }
    window.addEventListener("pagehide", onUnload)
    return () => window.removeEventListener("pagehide", onUnload)
  }, [])

  useEffect(() => {
    if (!token) return

    // 채팅과 같은 이유로 인증은 쿠키로 넘어간다(SockJS 핸드셰이크에 헤더를 실을 수 없다).
    setWsAuthCookie(token)
    const sockjsUrl = `${window.location.protocol}//${window.location.host}/ws-stomp`

    const client = new Client({
      webSocketFactory: () => new SockJS(sockjsUrl),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: (frame) => {
        // /user/queue/** 는 STOMP 세션의 Principal 로 라우팅된다. Principal 이 없으면
        // 구독은 성공한 것처럼 보이지만 아무것도 오지 않는다 — 가장 찾기 어려운 실패라
        // CONNECTED 프레임의 user-name 으로 붙자마자 확인한다.
        const principal = frame.headers["user-name"]
        if (!principal) {
          console.warn(
            "[call] STOMP Principal 이 없습니다. /user/queue/call 로는 시그널이 오지 않습니다.",
            frame.headers
          )
        } else if (CALL_DEBUG) {
          console.log("[call] STOMP 연결됨, principal =", principal)
        }

        client.subscribe("/user/queue/call", (message) => {
          if (CALL_DEBUG) console.log("[call] 수신", message.body)
          let event: CallSignalEvent
          try {
            event = JSON.parse(message.body)
          } catch {
            console.error("[call] 시그널 JSON 파싱 실패", message.body)
            return
          }
          try {
            // 통화 API 에는 프로필 이미지가 없어서 채팅방 목록에서 가져다 쓴다
            if (event.signal === "INVITED") {
              const room = useChatRoomsStore
                .getState()
                .rooms.find((r) => r.roomId === event.call?.roomId)
              useCallStore.setState({ peerImageUrl: room?.participantImageUrl ?? null })
            }
            useCallStore.getState().applySignal(event)
          } catch (e) {
            // 예전에는 여기서 조용히 삼켜서, 시그널이 오는데도 전화가 안 울리는 것처럼 보였다
            console.error("[call] 시그널 처리 실패", e, event)
          }
        })
      },
      // 구독 권한이 없거나 destination 이 틀리면 서버가 ERROR 프레임으로 알려준다
      onStompError: (frame) =>
        console.error("[call] STOMP 오류", frame.headers["message"], frame.body),
      onWebSocketError: (e) => console.error("[call] 웹소켓 연결 실패", e),
    })

    client.activate()
    clientRef.current = client
    return () => {
      clientRef.current = null
      void client.deactivate()
    }
  }, [token])

  // 통화가 끝나면 채팅방에 기록을 남긴다.
  // 백엔드가 통화 기록 메시지를 만들어주지 않아 계약서·결제와 같은 접두사 규약으로 프론트가 보낸다.
  useEffect(() => {
    if (!pendingLog) return
    const client = clientRef.current
    const t = tokenRef.current
    // 통화 직후라 연결은 살아 있는 게 정상이다. 끊겨 있으면 기록은 포기한다
    // (재전송 큐를 두면 다음 로그인 때 뒤늦게 찍히는 게 더 이상하다).
    if (client?.connected && t) {
      client.publish({
        destination: "/app/chat.send",
        headers: { Authorization: `Bearer ${t}` },
        body: JSON.stringify({ roomId: pendingLog.roomId, message: pendingLog.message, fileUrls: [] }),
      })
    }
    clearPendingLog()
  }, [pendingLog, clearPendingLog])

  // 로그아웃하면 통화도 끊는다
  useEffect(() => {
    if (!token && useCallStore.getState().phase !== "idle") {
      void useCallStore.getState().reset()
    }
  }, [token])

  return (
    <>
      <CallDock />
      <CallOverlay />
    </>
  )
}
