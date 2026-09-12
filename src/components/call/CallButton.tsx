"use client"

// 통화 화면 어디서나 쓰는 동그란 버튼.
// 우하단 도크와 전체화면이 같은 조작을 제공해야 해서 한 곳에 둔다.
export default function CallButton({
  onClick,
  disabled,
  label,
  tone = "normal",
  size = "md",
  showLabel = true,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  label: string
  // normal = 정상 동작 중, off = 꺼둔 상태(흰 버튼으로 강조), on = 켜둔 기능(브랜드 컬러)
  tone?: "normal" | "off" | "on" | "danger" | "accept"
  size?: "md" | "sm"
  showLabel?: boolean
  children: React.ReactNode
}) {
  const tones: Record<string, string> = {
    normal: "bg-white/10 text-white hover:bg-white/20",
    off: "bg-white text-zinc-900 hover:bg-white/90",
    on: "bg-main text-white hover:brightness-110",
    danger: "bg-red-500 text-white hover:bg-red-600",
    accept: "bg-emerald-500 text-white hover:bg-emerald-600",
  }
  const sizes = {
    md: "w-14 h-14 text-2xl",
    sm: "w-10 h-10 text-lg",
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        title={label}
        className={`flex items-center justify-center rounded-full transition disabled:opacity-40 disabled:cursor-not-allowed ${sizes[size]} ${tones[tone]}`}
      >
        {children}
      </button>
      {showLabel && <span className="text-[11px] text-white/50">{label}</span>}
    </div>
  )
}
