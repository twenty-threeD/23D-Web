"use client"

import { useEffect, useRef, useState } from "react"
import { CiCamera } from "react-icons/ci"
import Image from "next/image"
import { uploadFile } from "@/src/lib/file"
import { isPayloadTooLarge } from "@/src/lib/apiError"
import { useAuthStore } from "@/src/store/authStore"
import { useToast } from "@/src/hooks/useToast"
import ImageLightbox from "@/src/components/ImageLightbox"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
const MAX_IMAGES = 10
const MAX_FILE_SIZE = 25 * 1024 * 1024

interface UploadFileProps {
  initialImages?: string[]
  onUpload?: (urls: string[]) => void
}

export default function UploadFile({ initialImages, onUpload }: UploadFileProps) {
  const token = useAuthStore((s) => s.accessToken)
  const { addToast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState<string[]>(initialImages ?? [])
  const [uploading, setUploading] = useState(false)
  const [showLightbox, setShowLightbox] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [previewIndex, setPreviewIndex] = useState(0)

  const clampedPreview = Math.min(previewIndex, Math.max(images.length - 1, 0))
  const bigImage = images[clampedPreview]

  useEffect(() => {
    if (initialImages && initialImages.length > 0) setImages(initialImages)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialImages])

  async function handleFiles(files: FileList | null) {
    if (!files || !token) return

    const validFiles = Array.from(files).filter((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        addToast({ message: `${file.name}: 지원되지 않는 파일 형식입니다. (JPG, PNG, GIF, WEBP만 가능)`, type: "error" })
        return false
      }
      if (file.size > MAX_FILE_SIZE) {
        addToast({ message: `${file.name}: 사진은 최대 25MB까지 업로드할 수 있어요.`, type: "error" })
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
      const next = [...images, ...uploaded].slice(0, MAX_IMAGES)
      setImages(next)
      onUpload?.(next)
    } catch (e) {
      addToast({
        message: isPayloadTooLarge(e) ? "사진은 최대 25MB까지 업로드할 수 있어요." : "이미지 업로드에 실패했습니다.",
        type: "error",
      })
    } finally {
      setUploading(false)
    }
  }

  function removeImage(i: number) {
    const next = images.filter((_, j) => j !== i)
    setImages(next)
    setPreviewIndex(0)
    onUpload?.(next)
  }

  function reorder(from: number, to: number) {
    if (from === to) return
    const next = [...images]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setImages(next)
    setPreviewIndex(0)
    onUpload?.(next)
  }

  return (
    <div className="w-82 rounded-lg flex flex-col gap-2">
      <h1 className="text-xl font-bold">사진<span className="text-red-500">*</span></h1>
      <div className="flex flex-col gap-9.5">
      <button
        type="button"
        onClick={() => (bigImage ? setShowLightbox(true) : inputRef.current?.click())}
        className="relative h-82 flex flex-col items-center justify-center border border-zinc-300 rounded-lg bg-zinc-50 cursor-pointer hover:bg-zinc-100 overflow-hidden"
      >
        {bigImage ? (
          <Image
            src={bigImage}
            alt="미리보기 이미지"
            width={328}
            height={328}
            className="w-full h-full object-cover"
          />
        ) : (
          <>
            <CiCamera className="text-9xl text-zinc-400" />
            <span className="text-xl font-bold text-zinc-500">
              {uploading ? "업로드 중..." : "사진을 업로드 해주세요."}
            </span>
          </>
        )}
        {uploading && bigImage && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="w-8 h-8 rounded-full border-2 border-white border-t-transparent animate-spin" />
          </div>
        )}
      </button>

      {showLightbox && bigImage && (
        <ImageLightbox src={bigImage} alt="미리보기 이미지" onClose={() => setShowLightbox(false)} />
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {images.length > 0 && (
        <p className="text-xs text-zinc-400 -mt-6 shrink-0">사진을 클릭하면 위에 크게 보이고, 드래그로 순서를 바꾸면 대표 이미지가 바뀌어요.</p>
      )}

      <div className="shrink-0 flex items-start rounded-lg gap-2 overflow-x-auto overflow-y-hidden pb-3 -mb-3">
        {Array.from({ length: MAX_IMAGES }).map((_, i) => (
          <div
            key={i}
            draggable={!!images[i]}
            onDragStart={() => setDragIndex(i)}
            onDragOver={(e) => {
              if (!images[i]) return
              e.preventDefault()
              setDragOverIndex(i)
            }}
            onDragLeave={() => setDragOverIndex((cur) => (cur === i ? null : cur))}
            onDrop={(e) => {
              e.preventDefault()
              if (dragIndex !== null && images[i]) reorder(dragIndex, i)
              setDragIndex(null)
              setDragOverIndex(null)
            }}
            onDragEnd={() => {
              setDragIndex(null)
              setDragOverIndex(null)
            }}
            className={`relative shrink-0 w-18 h-18 border rounded-lg bg-zinc-50 overflow-hidden ${
              images[i] ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
            } ${
              i === dragOverIndex
                ? "border-main border-2"
                : i === clampedPreview && images[i]
                  ? "border-main border-2"
                  : i === 0 && images[0]
                    ? "border-main"
                    : "border-zinc-300"
            } ${i === dragIndex ? "opacity-40" : ""}`}
            onClick={() => (images[i] ? setPreviewIndex(i) : inputRef.current?.click())}
          >
            {images[i] ? (
              <>
                <Image
                  src={images[i]}
                  alt={`이미지 ${i + 1}`}
                  width={72}
                  height={72}
                  className="w-full h-full object-cover pointer-events-none"
                />
                {i === 0 && (
                  <span className="absolute bottom-0.5 left-0.5 px-1 rounded bg-main/90 text-white text-[10px] font-semibold">
                    대표
                  </span>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeImage(i)
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
    </div>
  )
}
