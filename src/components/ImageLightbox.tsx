"use client"

import Image from "next/image"

interface ImageLightboxProps {
  src: string
  alt?: string
  onClose: () => void
}

export default function ImageLightbox({ src, alt = "", onClose }: ImageLightboxProps) {
  return (
    <div
      className="fixed inset-0 z-100 bg-black/80 flex items-center justify-center p-8 cursor-zoom-out"
      onClick={onClose}
    >
      <div
        className="relative w-full h-full cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <Image src={src} alt={alt} fill sizes="100vw" className="object-contain rounded-lg" />
      </div>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white text-xl flex items-center justify-center hover:bg-white/20 cursor-pointer"
        aria-label="닫기"
      >
        ×
      </button>
    </div>
  )
}
