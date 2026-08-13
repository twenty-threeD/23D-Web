"use client"

import { useRef, useState } from "react"
import { CiCamera } from "react-icons/ci"
import Image from "next/image"
import { uploadFile } from "@/src/lib/file"
import { isPayloadTooLarge } from "@/src/lib/apiError"
import { useAuthStore } from "@/src/store/authStore"
import { useToast } from "@/src/hooks/useToast"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]

interface UploadFileProps {
  onUpload?: (url: string) => void
}

export default function UploadFile({ onUpload }: UploadFileProps) {
  const token = useAuthStore((s) => s.accessToken)
  const { addToast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  async function handleFiles(files: FileList | null) {
    if (!files || !token) return

    const validFiles = Array.from(files).filter((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        addToast({ message: `${file.name}: 지원되지 않는 파일 형식입니다. (JPG, PNG, GIF, WEBP만 가능)`, type: "error" })
        return false
      }
      return true
    })
    if (validFiles.length === 0) return

    setUploading(true)
    try {
      const uploaded: string[] = []
      for (const file of validFiles) {
        const { url } = await uploadFile(token, file)
        uploaded.push(url)
      }
      const next = [...images, ...uploaded].slice(0, 5)
      setImages(next)
      if (next[0]) onUpload?.(next[0])
    } catch (e) {
      addToast({
        message: isPayloadTooLarge(e) ? "사진은 최대 10MB까지 업로드할 수 있어요." : "이미지 업로드에 실패했습니다.",
        type: "error",
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="w-82 h-109 rounded-lg flex flex-col gap-9.5">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative h-82 flex flex-col items-center justify-center border border-zinc-300 rounded-lg bg-zinc-50 cursor-pointer hover:bg-zinc-100"
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
        {uploading && images[0] && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
            <div className="w-8 h-8 rounded-full border-2 border-white border-t-transparent animate-spin" />
          </div>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="h-18 flex rounded-lg gap-2 overflow-x-auto">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="relative shrink-0 w-18 h-18 border border-zinc-300 rounded-lg bg-zinc-50 overflow-hidden cursor-pointer"
            onClick={() => !images[i] && inputRef.current?.click()}
          >
            {images[i] ? (
              <>
                <Image
                  src={images[i]}
                  alt={`이미지 ${i + 1}`}
                  width={72}
                  height={72}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    const next = images.filter((_, j) => j !== i)
                    setImages(next)
                    if (next[0]) onUpload?.(next[0])
                    else onUpload?.("")
                  }}
                  className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center cursor-pointer"
                >
                  ×
                </button>
              </>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
