"use client"

// 폼 입력의 테두리·여백·포커스 스타일을 한곳에서 관리한다.
export const inputClass =
  "border border-zinc-300 rounded-lg px-3 py-2.5 text-sm transition-colors " +
  "focus:outline-none focus:border-main hover:border-zinc-400 " +
  "disabled:bg-zinc-100 disabled:text-zinc-500 disabled:hover:border-zinc-300"

// 인풋 안에 버튼·단위 같은 걸 같이 넣을 때 쓰는 껍데기 (인풋 자체는 border 없이)
export const inputShellClass =
  "flex items-center gap-1 border border-zinc-300 rounded-lg px-3 py-2.5 transition-colors " +
  "focus-within:border-main hover:border-zinc-400"

interface FieldProps {
  label: string
  children: React.ReactNode
}

export default function Field({ label, children }: FieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-zinc-600">{label}</span>
      {children}
    </label>
  )
}
