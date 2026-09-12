"use client"

import { useEffect, useRef } from "react"
import type { ILocalVideoTrack, IRemoteVideoTrack } from "agora-rtc-sdk-ng"

type AnyVideoTrack = ILocalVideoTrack | IRemoteVideoTrack

// 아고라 트랙은 DOM 엘리먼트에 직접 붙인다(내부에서 <video> 를 만들어 넣는다).
// React 가 그 안을 건드리면 안 되므로 빈 div 만 넘겨주고 자식은 두지 않는다.
export default function VideoTile({
  track,
  fit = "cover",
  mirrored = false,
  className = "",
}: {
  track: AnyVideoTrack | null | undefined
  fit?: "cover" | "contain"
  mirrored?: boolean
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !track) return
    track.play(el, { fit })
    return () => {
      // 원격 트랙은 stop() 해도 구독은 유지된다. 다시 play 하면 그대로 붙는다.
      track.stop()
    }
  }, [track, fit])

  return (
    <div
      ref={ref}
      className={`${className} ${mirrored ? "[&_video]:scale-x-[-1]" : ""}`}
    />
  )
}
