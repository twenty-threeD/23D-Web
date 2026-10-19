import Image from "next/image"

interface PhoneFrameProps {
  /** iPhone 17 Pro 시뮬레이터에서 찍은 잇다 앱 화면 (1206x2622, 상태 표시줄 포함) */
  src: string
  alt: string
  className?: string
  priority?: boolean
}

// 잇다 앱 화면을 담는 아이폰 목업.
// 캡처에 상태 표시줄까지 들어 있어 화면은 그대로 두고, 그 위에 다이내믹 아일랜드만 얹는다.
// 크기는 쓰는 쪽에서 폭만 정하면 되고, 테두리·버튼·모서리는 휴대폰 폭(cqw)을 따라 함께 커지고 작아진다.
// cqw 는 자기 자신이 아니라 바깥 컨테이너 폭을 따르므로, 폭을 재는 껍데기와 틀을 나눠 둔다
export default function PhoneFrame({ src, alt, className = "", priority = false }: PhoneFrameProps) {
  return (
    <div className={`@container ${className}`}>
      <div className="relative">
        {/* 측면 버튼: 왼쪽은 동작 버튼·음량 버튼 두 개, 오른쪽은 측면 버튼이다 */}
        <span className="absolute top-[17%] -left-[0.9cqw] h-[5%] w-[1.4cqw] rounded-l-[0.6cqw] bg-gradient-to-r from-zinc-500 to-zinc-300" />
        <span className="absolute top-[25%] -left-[0.9cqw] h-[8.5%] w-[1.4cqw] rounded-l-[0.6cqw] bg-gradient-to-r from-zinc-500 to-zinc-300" />
        <span className="absolute top-[35%] -left-[0.9cqw] h-[8.5%] w-[1.4cqw] rounded-l-[0.6cqw] bg-gradient-to-r from-zinc-500 to-zinc-300" />
        <span className="absolute top-[28%] -right-[0.9cqw] h-[12%] w-[1.4cqw] rounded-r-[0.6cqw] bg-gradient-to-l from-zinc-500 to-zinc-300" />

        {/* 티타늄 테두리 → 검은 베젤 → 화면 순으로 겹친다 */}
        <div className="relative rounded-[17cqw] bg-gradient-to-br from-zinc-300 via-zinc-500 to-zinc-300 p-[1.1cqw] shadow-[0_40px_80px_-30px_rgba(24,24,27,.55)]">
          <div className="rounded-[16cqw] bg-black p-[3cqw]">
            <div className="relative aspect-[1206/2622] overflow-hidden rounded-[13.2cqw] bg-white">
              <Image src={src} alt={alt} fill sizes="(max-width: 768px) 50vw, 320px" priority={priority} className="object-cover" />
              {/* 다이내믹 아일랜드 */}
              <span className="absolute top-[1.25%] left-1/2 h-[4.1%] w-[31%] -translate-x-1/2 rounded-full bg-black" />
              {/* 유리에 비치는 옅은 빛 */}
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 휴대폰 아래에 깔리는 그림자. 휴대폰이 바닥에서 떠 있는 것처럼 보이게 한다
export function PhoneShadow({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <div aria-hidden className={`aspect-[7/1] w-[78%] rounded-[50%] bg-zinc-900/25 blur-xl ${className}`} style={style} />
}
