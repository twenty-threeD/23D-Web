"use client"

import { useRef, useState } from "react"
import { CiCamera } from "react-icons/ci"
import Image from "next/image"
import { uploadFile } from "@/src/lib/file"
import { useAuthStore } from "@/src/store/authStore"

interface UploadFileProps {
  onUpload?: (url: string) => void
}

export default function UploadFile({ onUpload }: UploadFileProps) {
  const token = useAuthStore((s) => s.accessToken)
  const inputRef = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  async function handleFiles(files: FileList | null) {
    if (!files || !token) return
    setUploading(true)
    try {
      const uploaded: string[] = []
      for (const file of Array.from(files)) {
        const { url } = await uploadFile(token, file)
        uploaded.push(url)
      }
      const next = [...images, ...uploaded].slice(0, 5)
      setImages(next)
      if (next[0]) onUpload?.(next[0])
    } catch {
      /* ignore */
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="w-82 h-109 rounded-lg flex flex-col gap-9.5">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="h-82 flex flex-col items-center justify-center border border-zinc-300 rounded-lg bg-zinc-50 cursor-pointer hover:bg-zinc-100"
      >
        {images[0] ? (
          <Image
            src={images[0]}
            alt="대표 이미지"
            width={328}
            height={328}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <>
            <CiCamera className="text-9xl text-zinc-400" />
            <span className="text-xl font-bold text-zinc-500">
              {uploading ? "업로드 중..." : "사진을 업로드 해주세요."}
            </span>
          </>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="h-18 flex rounded-lg gap-2 overflow-x-auto">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="shrink-0 w-18 h-18 border border-zinc-300 rounded-lg bg-zinc-50 overflow-hidden cursor-pointer"
            onClick={() => !images[i] && inputRef.current?.click()}
          >
            {images[i] ? (
              <Image
                src={images[i]}
                alt={`이미지 ${i + 1}`}
                width={72}
                height={72}
                className="w-full h-full object-cover"
              />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
