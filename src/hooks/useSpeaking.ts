"use client"

import { useEffect, useState } from "react"
import { callEngine } from "@/src/lib/agoraEngine"

// 음량(0~1)이 이 값을 넘으면 말하는 중으로 본다. 조용한 방의 잡음은 0.02 안팎이라 넉넉히 위로 둔다
const SPEAKING_LEVEL = 0.08
const POLL_MS = 150
// 말 사이 짧은 숨에 링이 깜빡이지 않도록 한 번 켜지면 잠깐 유지한다
const HOLD_MS = 400

const SILENT = { me: false, peer: false }

// 통화 중 나와 상대가 지금 말하고 있는지. 말하는 쪽 프로필·영상에 주황 링을 띄우는 데 쓴다
export function useSpeaking(active: boolean) {
  const [speaking, setSpeaking] = useState(SILENT)

  useEffect(() => {
    if (!active) return
    const lastLoud = { me: 0, peer: 0 }
    const id = setInterval(() => {
      const { me, peer } = callEngine.getVolumeLevels()
      const now = Date.now()
      if (me >= SPEAKING_LEVEL) lastLoud.me = now
      if (peer >= SPEAKING_LEVEL) lastLoud.peer = now
      const next = { me: now - lastLoud.me < HOLD_MS, peer: now - lastLoud.peer < HOLD_MS }
      setSpeaking((prev) => (prev.me === next.me && prev.peer === next.peer ? prev : next))
    }, POLL_MS)
    return () => clearInterval(id)
  }, [active])

  // 통화가 끝나면 마지막 값이 남지 않게 꺼진 상태로 본다
  return active ? speaking : SILENT
}
