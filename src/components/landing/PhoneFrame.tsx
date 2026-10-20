import Image from "next/image"

// Blender 로 렌더한 휴대폰 이미지 크기. 세 장 모두 같은 범위로 잘라 크기·위치가 같다
export const PHONE_RENDER_WIDTH = 486
export const PHONE_RENDER_HEIGHT = 1012

interface PhoneFrameProps {
  /** 휴대폰을 통째로 렌더한 투명 배경 이미지 */
  src: string
  alt: string
  className?: string
  priority?: boolean
}

// 잇다 앱 화면이 켜진 아이폰.
// CSS 로 그린 틀은 테두리 반사가 없어 평면처럼 보여서, iPhone 16 모델에 앱 캡처를 입혀 Blender(Cycles)로 렌더한 이미지를 쓴다.
// 화면을 바꾸려면 렌더를 다시 뽑아야 한다
export default function PhoneFrame({ src, alt, className = "", priority = false }: PhoneFrameProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={PHONE_RENDER_WIDTH}
      height={PHONE_RENDER_HEIGHT}
      sizes="(max-width: 768px) 40vw, 280px"
      priority={priority}
      className={`h-auto w-full ${className}`}
    />
  )
}

// 휴대폰 아래에 깔리는 그림자. 휴대폰이 바닥에서 떠 있는 것처럼 보이게 한다
export function PhoneShadow({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <div aria-hidden className={`aspect-[7/1] w-[78%] rounded-[50%] bg-zinc-900/25 blur-xl ${className}`} style={style} />
}
