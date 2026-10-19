"use client"

import { useState } from "react"
import Image, { type ImageProps } from "next/image"
import { toRelativeUrl } from "@/src/lib/file"
import { NO_POST_IMAGE } from "@/src/lib/post"

interface PostImageProps extends Omit<ImageProps, "src" | "onError"> {
  src: string
  /** 대체 이미지를 보여줄 때 className 대신 쓴다 (가로로 긴 칸에서 대체 이미지가 잘리지 않게 할 때) */
  fallbackClassName?: string
}

// 서비스 대표 이미지. 글에는 이미지 주소가 남아 있는데 서버에서 파일만 사라진 경우가 있어(404),
// 주소가 비었을 때뿐 아니라 불러오기에 실패했을 때도 대체 이미지로 바꾼다.
// 그대로 두면 깨진 이미지 아이콘과 alt 글자가 카드에 보인다
export default function PostImage({ src, className, fallbackClassName, alt, ...props }: PostImageProps) {
  // 실패한 주소를 기억해 두면, 다른 글로 바뀌어 src 가 달라졌을 때 따로 되돌리지 않아도 새 이미지를 다시 시도한다
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const fallback = src === NO_POST_IMAGE || failedSrc === src

  return (
    <Image
      {...props}
      src={fallback ? NO_POST_IMAGE : toRelativeUrl(src)}
      alt={alt}
      className={fallback ? (fallbackClassName ?? className) : className}
      onError={() => setFailedSrc(src)}
    />
  )
}
