"use client"

import { useEffect } from "react"
import { IoClose } from "react-icons/io5"

type ModalWidth = "sm" | "md" | "lg"

const WIDTH_CLASS: Record<ModalWidth, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-5xl",
}

interface ModalProps {
  title: string
  width?: ModalWidth
  /** 배경 클릭으로 닫히지 않게 하려면 false (작성 중 내용이 날아가면 안 되는 모달) */
  closeOnBackdrop?: boolean
  /** 본문을 직접 채우는 모달(계약서처럼)은 기본 패딩을 끈다 */
  bare?: boolean
  onClose: () => void
  children: React.ReactNode
}

export default function Modal({
  title,
  width = "md",
  closeOnBackdrop = true,
  bare = false,
  onClose,
  children,
}: ModalProps) {
  // 모달이 열려 있는 동안 뒤 페이지가 스크롤되지 않게 하고, ESC로 닫는다.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-modal-backdrop p-4"
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div
        className={`bg-white w-full ${WIDTH_CLASS[width]} max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-modal-panel`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 shrink-0">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <IoClose className="text-xl" />
          </button>
        </div>

        <div className={bare ? "flex flex-1 overflow-hidden" : "flex flex-col gap-4 px-6 py-5 overflow-y-auto"}>
          {children}
        </div>
      </div>
    </div>
  )
}

/** 모달 하단의 버튼 줄. 취소/확인 배치를 통일한다. */
export function ModalActions({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-2 justify-end pt-1">{children}</div>
}
