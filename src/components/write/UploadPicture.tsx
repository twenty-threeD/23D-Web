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
const MAX_CONTENT_IMAGES = 10
const MAX_FILE_SIZE = 25 * 1024 * 1024

interface UploadFileProps {
  // 서버가 반환하는 순서: 헤더 이미지, 메인 이미지, 나머지 이미지
  initialImages?: string[]
  onUpload?: (urls: string[]) => void
}

export default function UploadFile({ initialImages, onUpload }: UploadFileProps) {
  const token = useAuthStore((s) => s.accessToken)
  const { addToast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const headerInputRef = useRef<HTMLInputElement>(null)
  const lastEmittedImagesRef = useRef<string[]>(initialImages ?? [])
  const [headerImage, setHeaderImage] = useState(initialImages?.[0] ?? "")
  const [images, setImages] = useState<string[]>(initialImages?.slice(1) ?? [])
  const [uploading, setUploading] = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [previewIndex, setPreviewIndex] = useState(0)

  const clampedPreview = Math.min(previewIndex, Math.max(images.length - 1, 0))
  const bigImage = images[clampedPreview]

  useEffect(() => {
    // 수정 화면에서 서버 데이터를 받은 뒤 업로더 상태를 동기화한다.
    const nextImages = initialImages ?? []
    const isSameAsLastEmission =
      nextImages.length === lastEmittedImagesRef.current.length &&
      nextImages.every((url, index) => url === lastEmittedImagesRef.current[index])
    if (isSameAsLastEmission) return

    lastEmittedImagesRef.current = nextImages
    setHeaderImage(initialImages?.[0] ?? "")
    setImages(initialImages?.slice(1, MAX_CONTENT_IMAGES + 1) ?? [])
    setPreviewIndex(0)
  }, [initialImages])

  function emitImages(nextHeader: string, nextImages: string[]) {
    const orderedImages = nextHeader ? [nextHeader, ...nextImages] : nextImages
    lastEmittedImagesRef.current = orderedImages
    onUpload?.(orderedImages)
  }

  function validateFile(file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      addToast({ message: `${file.name}: 지원되지 않는 파일 형식입니다. (JPG, PNG, GIF, WEBP만 가능)`, type: "error" })
      return false
    }
    if (file.size > MAX_FILE_SIZE) {
      addToast({ message: `${file.name}: 사진은 최대 25MB까지 업로드할 수 있어요.`, type: "error" })
      return false
    }
    return true
  }

  async function handleHeaderFile(file: File | undefined) {
    if (!file || !token || !validateFile(file)) return

    setUploading(true)
    try {
      const { url } = await uploadFile(token, file)
      setHeaderImage(url)
      emitImages(url, images)
    } catch (e) {
      addToast({
        message: isPayloadTooLarge(e) ? "사진은 최대 25MB까지 업로드할 수 있어요." : "헤더 이미지 업로드에 실패했습니다.",
        type: "error",
      })
    } finally {
      setUploading(false)
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files || !token) return

    const validFiles = Array.from(files).filter(validateFile)
    if (validFiles.length === 0) return

    const available = MAX_CONTENT_IMAGES - images.length
    if (available <= 0) {
      addToast({ message: `메인 및 상세 이미지는 최대 ${MAX_CONTENT_IMAGES}장까지 업로드할 수 있어요.`, type: "warning" })
      return
    }

    setUploading(true)
    try {
      const uploaded: string[] = []
      for (const file of validFiles.slice(0, available)) {
        const { url } = await uploadFile(token, file)
        uploaded.push(url)
      }
      const next = [...images, ...uploaded]
      setImages(next)
      emitImages(headerImage, next)
    } catch (e) {
      addToast({
        message: isPayloadTooLarge(e) ? "사진은 최대 25MB까지 업로드할 수 있어요." : "이미지 업로드에 실패했습니다.",
        type: "error",
      })
    } finally {
      setUploading(false)
    }
  }

  function removeHeader() {
    setHeaderImage("")
    emitImages("", images)
  }

  function removeImage(index: number) {
    const next = images.filter((_, i) => i !== index)
    setImages(next)
    setPreviewIndex(0)
    emitImages(headerImage, next)
  }

  function reorder(from: number, to: number) {
    if (from === to) return
    const next = [...images]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setImages(next)
    setPreviewIndex(0)
    emitImages(headerImage, next)
  }

  return (
    <div className="w-82 rounded-lg flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-bold">헤더 이미지<span className="text-red-500">*</span></h1>
        <div className="relative">
          <button
            type="button"
            onClick={() => (headerImage ? setLightboxSrc(headerImage) : headerInputRef.current?.click())}
            className="relative w-full h-12 flex flex-col items-center justify-center border border-zinc-300 rounded-lg bg-zinc-50 cursor-pointer hover:bg-zinc-100 overflow-hidden"
            aria-label={headerImage ? "헤더 이미지 크게 보기" : "헤더 이미지 업로드"}
          >
            {headerImage ? (
              <Image src={headerImage} alt="헤더 이미지 미리보기" width={328} height={48} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-zinc-500">헤더 이미지를 업로드해주세요.</span>
            )}
            {uploading && headerImage && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="w-8 h-8 rounded-full border-2 border-white border-t-transparent animate-spin" />
              </div>
            )}
          </button>
          {headerImage && (
            <button
              type="button"
              onClick={removeHeader}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white text-sm flex items-center justify-center cursor-pointer"
              aria-label="헤더 이미지 삭제"
            >
              ×
            </button>
          )}
        </div>
        <input
          ref={headerInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={(e) => {
            void handleHeaderFile(e.target.files?.[0])
            e.target.value = ""
          }}
        />
        <p className="text-xs text-zinc-400">서비스 상단에 보여지는 대표 이미지입니다.</p>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-bold">메인 및 상세 이미지<span className="text-red-500">*</span></h1>
        <button
          type="button"
          onClick={() => (bigImage ? setLightboxSrc(bigImage) : inputRef.current?.click())}
          className="relative h-82 flex flex-col items-center justify-center border border-zinc-300 rounded-lg bg-zinc-50 cursor-pointer hover:bg-zinc-100 overflow-hidden"
          aria-label={bigImage ? "메인 이미지 크게 보기" : "메인 이미지 업로드"}
        >
          {bigImage ? (
            <Image src={bigImage} alt="메인 이미지 미리보기" width={328} height={328} className="w-full h-full object-cover" />
          ) : (
            <>
              <CiCamera className="text-9xl text-zinc-400" />
              <span className="text-xl font-bold text-zinc-500">
                {uploading ? "업로드 중..." : "메인 이미지를 업로드해주세요."}
              </span>
            </>
          )}
          {uploading && bigImage && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="w-8 h-8 rounded-full border-2 border-white border-t-transparent animate-spin" />
            </div>
          )}
        </button>

        {lightboxSrc && (
          <ImageLightbox src={lightboxSrc} alt="이미지" onClose={() => setLightboxSrc(null)} />
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            void handleFiles(e.target.files)
            e.target.value = ""
          }}
        />

        {images.length > 0 && (
          <p className="text-xs text-zinc-400">첫 번째 이미지가 메인 이미지로 사용됩니다. 드래그로 순서를 바꿀 수 있어요.</p>
        )}

        <div className="shrink-0 flex items-start rounded-lg gap-2 overflow-x-auto overflow-y-hidden pb-3 -mb-3">
          {Array.from({ length: MAX_CONTENT_IMAGES }).map((_, i) => (
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
                      메인
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeImage(i)
                    }}
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center cursor-pointer"
                    aria-label={`이미지 ${i + 1} 삭제`}
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
