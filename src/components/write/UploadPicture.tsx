"use client"

import { useEffect, useRef, useState } from "react"
import { LuImage, LuX } from "react-icons/lu"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { signinPath } from "@/src/lib/navigation"
import { uploadFile } from "@/src/lib/file"
import { isPayloadTooLarge } from "@/src/lib/apiError"
import { useAuthStore } from "@/src/store/authStore"
import { useToast } from "@/src/hooks/useToast"
import ImageLightbox from "@/src/components/ImageLightbox"
import { FieldLabel } from "@/src/components/write/WriteInputField"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
// 백엔드는 게시글당 이미지를 헤더 포함 최대 6장까지 받는다.
// 헤더가 필수라 한 장을 항상 차지하므로 메인·상세 이미지는 5장까지만 허용한다.
const MAX_POST_IMAGES = 6
const MAX_CONTENT_IMAGES = MAX_POST_IMAGES - 1
const MAX_FILE_SIZE = 25 * 1024 * 1024

interface UploadFileProps {
  // 서버가 반환하는 순서: 헤더 이미지, 메인 이미지, 나머지 이미지
  initialImages?: string[]
  onUpload?: (urls: string[]) => void
}

function Spinner() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
      <div className="size-8 rounded-full border-2 border-white border-t-transparent animate-spin" />
    </div>
  )
}

export default function UploadFile({ initialImages, onUpload }: UploadFileProps) {
  const router = useRouter()
  const token = useAuthStore((s) => s.accessToken)
  const { addToast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const headerInputRef = useRef<HTMLInputElement>(null)
  const lastEmittedImagesRef = useRef<string[]>(initialImages ?? [])
  const [headerImage, setHeaderImage] = useState(initialImages?.[0] ?? "")
  const [images, setImages] = useState<string[]>(initialImages?.slice(1, MAX_CONTENT_IMAGES + 1) ?? [])
  // 업로드 중 여부를 영역별로 나눈다. 하나로 공유하면 헤더만 올려도
  // 메인·상세 영역에 스피너가 돌아, 사용자가 메인 이미지가 올라가는 중이라고 오해했다.
  const [headerUploading, setHeaderUploading] = useState(false)
  const [contentUploading, setContentUploading] = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [previewIndex, setPreviewIndex] = useState(0)

  // 헤더와 메인·상세 업로드가 동시에 진행될 수 있어, 먼저 끝난 쪽의 결과를
  // 나중에 끝난 쪽이 오래된 클로저 값으로 덮어쓰지 않도록 최신 값을 ref 로도 들고 있는다.
  const latestRef = useRef({ header: headerImage, images })

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
    const nextHeader = initialImages?.[0] ?? ""
    const nextContent = initialImages?.slice(1, MAX_CONTENT_IMAGES + 1) ?? []
    latestRef.current = { header: nextHeader, images: nextContent }
    setHeaderImage(nextHeader)
    setImages(nextContent)
    setPreviewIndex(0)
  }, [initialImages])

  function commit(nextHeader: string, nextImages: string[]) {
    latestRef.current = { header: nextHeader, images: nextImages }
    setHeaderImage(nextHeader)
    setImages(nextImages)
    // 0번 칸은 항상 헤더 자리로 둔다. 헤더 없이 메인만 올렸을 때 앞으로 당기면
    // 첫 메인 이미지가 헤더로 취급돼 등록 시 헤더 누락 검사를 통과해버린다.
    const orderedImages = nextImages.length > 0 || nextHeader ? [nextHeader, ...nextImages] : []
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
    if (!file) return
    if (!token) { router.push(signinPath()); return }
    if (!validateFile(file)) return

    setHeaderUploading(true)
    try {
      const { url } = await uploadFile(token, file)
      commit(url, latestRef.current.images)
    } catch (e) {
      addToast({
        message: isPayloadTooLarge(e) ? "사진은 최대 25MB까지 업로드할 수 있어요." : "헤더 이미지 업로드에 실패했습니다.",
        type: "error",
      })
    } finally {
      setHeaderUploading(false)
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files) return
    // 토큰이 없을 때 조용히 끝내면 사용자는 업로드가 고장 난 것으로 본다. 로그인 후 이 화면으로 돌아온다
    if (!token) { router.push(signinPath()); return }

    const validFiles = Array.from(files).filter(validateFile)
    if (validFiles.length === 0) return

    const available = MAX_CONTENT_IMAGES - latestRef.current.images.length
    if (validFiles.length > available) {
      addToast({ message: `메인 및 상세 이미지는 최대 ${MAX_CONTENT_IMAGES}장까지 업로드할 수 있어요.`, type: "warning" })
    }
    if (available <= 0) return

    setContentUploading(true)
    try {
      const uploaded: string[] = []
      for (const file of validFiles.slice(0, available)) {
        const { url } = await uploadFile(token, file)
        uploaded.push(url)
      }
      commit(latestRef.current.header, [...latestRef.current.images, ...uploaded].slice(0, MAX_CONTENT_IMAGES))
    } catch (e) {
      addToast({
        message: isPayloadTooLarge(e) ? "사진은 최대 25MB까지 업로드할 수 있어요." : "이미지 업로드에 실패했습니다.",
        type: "error",
      })
    } finally {
      setContentUploading(false)
    }
  }

  function removeHeader() {
    commit("", latestRef.current.images)
  }

  function removeImage(index: number) {
    setPreviewIndex(0)
    commit(latestRef.current.header, latestRef.current.images.filter((_, i) => i !== index))
  }

  function reorder(from: number, to: number) {
    if (from === to) return
    const next = [...latestRef.current.images]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setPreviewIndex(0)
    commit(latestRef.current.header, next)
  }

  function openContentPicker() {
    if (contentUploading) return
    if (images.length >= MAX_CONTENT_IMAGES) {
      addToast({ message: `메인 및 상세 이미지는 최대 ${MAX_CONTENT_IMAGES}장까지 업로드할 수 있어요.`, type: "warning" })
      return
    }
    inputRef.current?.click()
  }

  return (
    <div className="w-82 shrink-0 flex flex-col gap-12">
      <div className="flex flex-col gap-3.5">
        <FieldLabel isEssential>헤더 이미지</FieldLabel>
        <div className="relative">
          <button
            type="button"
            disabled={headerUploading}
            onClick={() => (headerImage ? setLightboxSrc(headerImage) : headerInputRef.current?.click())}
            className="relative w-full h-[42px] flex items-center justify-center bg-zinc-50 border border-line rounded-[10px] cursor-pointer transition-colors hover:border-ink-hint overflow-hidden disabled:cursor-wait"
            aria-label={headerImage ? "헤더 이미지 크게 보기" : "헤더 이미지 업로드"}
          >
            {headerImage ? (
              <Image src={headerImage} alt="헤더 이미지 미리보기" width={328} height={42} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-medium text-ink-hint">
                {headerUploading ? "업로드 중..." : "헤더 이미지를 업로드 해주세요."}
              </span>
            )}
            {headerUploading && headerImage && <Spinner />}
          </button>
          {headerImage && (
            <button
              type="button"
              onClick={removeHeader}
              className="absolute top-1/2 -translate-y-1/2 right-2 size-6 rounded-full bg-black/60 text-white flex items-center justify-center cursor-pointer"
              aria-label="헤더 이미지 삭제"
            >
              <LuX className="size-3.5" />
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
      </div>

      <div className="flex flex-col gap-3.5">
        <FieldLabel
          isEssential
          aside={<span className="text-xs font-medium text-ink-hint">{images.length}/{MAX_CONTENT_IMAGES}</span>}
        >
          메인 및 상세 이미지
        </FieldLabel>
        <div className="flex flex-col gap-[26px]">
          <button
            type="button"
            onClick={() => (bigImage ? setLightboxSrc(bigImage) : openContentPicker())}
            className="relative size-82 flex flex-col items-center justify-center gap-4 bg-zinc-50 border border-line rounded-xl cursor-pointer transition-colors hover:border-ink-hint overflow-hidden"
            aria-label={bigImage ? "메인 이미지 크게 보기" : "메인 이미지 업로드"}
          >
            {bigImage ? (
              <Image src={bigImage} alt="메인 이미지 미리보기" width={328} height={328} className="w-full h-full object-cover" />
            ) : (
              <>
                <LuImage className="size-9 text-ink-hint" strokeWidth={1.5} />
                <span className="text-base font-medium text-ink-hint">
                  {contentUploading ? "업로드 중..." : "사진을 업로드 해주세요."}
                </span>
              </>
            )}
            {contentUploading && bigImage && <Spinner />}
          </button>

          <div className="flex items-center gap-4 overflow-x-auto overflow-y-hidden">
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
                className={`relative shrink-0 size-18 bg-zinc-50 border rounded-xl overflow-hidden ${
                  images[i] ? "cursor-grab active:cursor-grabbing" : "cursor-pointer hover:border-ink-hint"
                } ${
                  i === dragOverIndex || (i === clampedPreview && images[i])
                    ? "border-main border-2"
                    : i === 0 && images[0]
                      ? "border-main"
                      : "border-line"
                } ${i === dragIndex ? "opacity-40" : ""}`}
                onClick={() => (images[i] ? setPreviewIndex(i) : openContentPicker())}
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
                      className="absolute top-0.5 right-0.5 size-5 rounded-full bg-black/60 text-white flex items-center justify-center cursor-pointer"
                      aria-label={`이미지 ${i + 1} 삭제`}
                    >
                      <LuX className="size-3" />
                    </button>
                  </>
                ) : null}
              </div>
            ))}
          </div>
          {images.length > 0 && (
            <p className="text-xs text-ink-hint">첫 번째 이미지가 메인 이미지로 사용됩니다. 드래그로 순서를 바꿀 수 있어요.</p>
          )}
        </div>

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
      </div>
    </div>
  )
}
