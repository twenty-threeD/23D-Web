"use client"

import { useState } from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import Modal from "@/src/components/ui/Modal"
import { ONESTORE_QR, ONESTORE_URL } from "@/src/lib/appStore"

// 스토어 배지처럼 생긴 원스토어 다운로드 버튼.
// 데스크톱에서는 컴퓨터에 앱을 깔 수 없으니 QR 코드를 띄워 휴대폰으로 찍게 하고,
// 휴대폰(손가락으로 누르는 화면)에서는 QR 을 찍을 수 없으니 원스토어로 바로 보낸다
export default function StoreButton() {
  const [qrOpen, setQrOpen] = useState(false)
  const className = "flex h-16 items-center gap-3 rounded-2xl bg-night pr-6 pl-4 text-white"
  const content = (
    <>
      {/* 원스토어 공식 사이트(onestore.co.kr)의 앱 아이콘 */}
      <Image src="/landing/onestore.webp" alt="" width={36} height={36} className="size-9" />
      <span className="flex flex-col leading-tight">
        <span className="text-xs text-white/60">다운로드</span>
        <span className="text-lg font-bold">원스토어</span>
      </span>
    </>
  )

  // 주소를 받기 전에는 누를 수 없게 둔다
  if (!ONESTORE_URL) {
    return (
      <span aria-disabled className={className}>
        {content}
      </span>
    )
  }

  const open = () => {
    if (window.matchMedia("(pointer: coarse)").matches) {
      window.open(ONESTORE_URL, "_blank", "noopener,noreferrer")
      return
    }
    setQrOpen(true)
  }

  return (
    <>
      <button type="button" onClick={open} className={`${className} cursor-pointer transition-colors hover:bg-ink`}>
        {content}
      </button>

      {/* 이 버튼은 GSAP 가 고정(pin)한 섹션 안에 있다. 고정된 섹션은 transform 이 걸려 안쪽의 fixed 가 화면이 아닌
          섹션을 기준으로 잡히므로, 모달은 body 로 빼서 띄운다 */}
      {qrOpen &&
        createPortal(
          <Modal title="잇다 앱 다운로드" width="sm" onClose={() => setQrOpen(false)}>
            <div className="flex flex-col items-center gap-5 text-center">
              <div className="rounded-2xl border border-line bg-white p-4">
                {/* 정사각형 SVG 한 장이라 고정 크기로 그린다 */}
                <Image src={ONESTORE_QR} alt="원스토어 잇다 앱 설치 QR 코드" width={200} height={200} unoptimized className="size-50" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="font-bold text-ink">휴대폰 카메라로 QR 코드를 찍어 주세요</p>
                <p className="text-sm text-ink-sub">원스토어 잇다 앱 페이지로 이동해요. (안드로이드)</p>
              </div>
              <a
                href={ONESTORE_URL}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-main underline-offset-4 hover:underline"
              >
                원스토어에서 바로 열기
              </a>
            </div>
          </Modal>,
          document.body
        )}
    </>
  )
}
