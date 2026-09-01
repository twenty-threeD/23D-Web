"use client"

type Variant = "primary" | "secondary" | "ghost"
type Size = "sm" | "md" | "lg"

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "bg-main text-white hover:bg-orange-600 disabled:hover:bg-main",
  secondary:
    "border border-zinc-300 text-zinc-600 hover:border-main hover:text-main disabled:hover:border-zinc-300 disabled:hover:text-zinc-600",
  ghost: "text-zinc-500 hover:bg-zinc-100",
}

const SIZE_CLASS: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "w-full py-3 text-sm",
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={`rounded-xl font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${VARIANT_CLASS[variant]} ${SIZE_CLASS[size]} ${className}`}
    />
  )
}
