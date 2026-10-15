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
  onAspect,
}: {
  track: AnyVideoTrack | null | undefined
  fit?: "cover" | "contain"
  mirrored?: boolean
  className?: string
  /** 영상의 가로/세로 비율이 정해지거나 바뀔 때(휴대폰을 돌렸을 때 등) 알려준다 */
  onAspect?: (ratio: number) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  // 부모가 다시 그려질 때마다 콜백이 새로 만들어져도 영상을 다시 붙이지 않도록 최신 콜백만 ref 로 읽는다
  const onAspectRef = useRef(onAspect)
  useEffect(() => {
    onAspectRef.current = onAspect
  }, [onAspect])

  useEffect(() => {
    const el = ref.current
    if (!el || !track) return
    track.play(el, { fit })

    // 가로로 찍는지 세로로 찍는지는 영상이 실제로 들어와야 안다. 아고라가 넣어 둔 <video> 의 크기를 읽는다
    let video: HTMLVideoElement | null = null
    const report = () => {
      if (video && video.videoWidth > 0 && video.videoHeight > 0) onAspectRef.current?.(video.videoWidth / video.videoHeight)
    }
    const attach = () => {
      const found = el.querySelector("video")
      if (!found || found === video) return
      video?.removeEventListener("resize", report)
      video?.removeEventListener("loadedmetadata", report)
      video = found
      video.addEventListener("resize", report)
      video.addEventListener("loadedmetadata", report)
      report()
    }
    attach()
    // 아고라가 <video> 를 나중에 넣거나 바꿔 끼우는 경우가 있어 지켜본다
    const observer = new MutationObserver(attach)
    observer.observe(el, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      video?.removeEventListener("resize", report)
      video?.removeEventListener("loadedmetadata", report)
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
