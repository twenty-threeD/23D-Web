"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import dynamic from "next/dynamic"
import CommunityMenu from "@/src/components/CommunitySideBar"
import { IoImageOutline, IoChevronDown } from "react-icons/io5"
import { getPost, createPost, updatePost, COMMUNITY_CATEGORIES, isCommunityCategory, parseRegion, tagRegion, type CommunityCategory } from "@/src/lib/community"
import { uploadFile } from "@/src/lib/file"
import { useAuthStore } from "@/src/store/authStore"
import { useHandleError } from "@/src/hooks/useHandleError"
import { signinPath } from "@/src/lib/navigation"
import { useMyLocation } from "@/src/hooks/useMyLocation"

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false })

export default function Page() {
  const router = useRouter()
  const params = useParams()
  const postId = params.id ? Number(Array.isArray(params.id) ? params.id[0] : params.id) : null
  const token = useAuthStore((s) => s.accessToken)
  const myUsername = useAuthStore((s) => {
    if (s.username) return s.username
    if (!s.accessToken) return null
    try {
      const p = JSON.parse(atob(s.accessToken.split('.')[1]))
      return p.username ?? p.sub ?? null
    } catch { return null }
  })
  const handleError = useHandleError()
  const { location, loaded: locationLoaded } = useMyLocation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cursorPosRef = useRef<number>(0)

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState<CommunityCategory | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(!!postId)

  const fetchPost = useCallback(async () => {
    if (!postId) return
    setLoading(true)
    try {
      const res = await getPost(postId, token)
      const data = res.data ?? res
      if (data.username && myUsername && data.username !== myUsername) {
        router.replace(`/posts/${postId}`)
        return
      }
      setTitle(data.title ?? "")
      // 지역 태그는 등록할 때 다시 붙이므로 에디터에는 본문만 보여준다
      setContent(parseRegion(data.content).body)
      const c = typeof data.category === "string" ? data.category : data.category?.name
      if (isCommunityCategory(c)) setCategory(c)
    } catch (e) {
      handleError(e)
      router.replace("/community")
    } finally {
      setLoading(false)
    }
  }, [postId, token, myUsername])

  useEffect(() => { fetchPost() }, [fetchPost])

  function handleUploadClick() {
    const ta = document.querySelector(".w-md-editor-text-input") as HTMLTextAreaElement | null
    if (ta) cursorPosRef.current = ta.selectionStart ?? content.length
    fileInputRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length || !token) return
    setUploading(true)

    let insertPos = cursorPosRef.current
    let newContent = content

    for (const file of files) {
      try {
        const { url } = await uploadFile(token, file)
        const md = `![image](${url})\n`
        newContent = newContent.slice(0, insertPos) + md + newContent.slice(insertPos)
        insertPos += md.length
      } catch (e) { handleError(e) }
    }

    setContent(newContent)
    setUploading(false)
    e.target.value = ""
  }

  // 본문 마크다운에서 첫 번째 이미지를 대표 이미지(fileUrl)로 사용한다
  function extractFileUrl(md: string) {
    return md.match(/!\[[^\]]*\]\(([^)\s]+)/)?.[1] ?? null
  }

  async function handleSubmit() {
    if (!token) { router.push(signinPath()); return }
    if (!isReady || !category) return
    setSubmitting(true)
    // 수정 시에도 현재 지역으로 다시 태그한다. 이사한 뒤 고친 글은 새 지역에 보이는 게 자연스럽다
    const body = category === "NEIGHBORHOOD" && location
      ? tagRegion(content, location.ctprvnCd)
      : parseRegion(content).body
    try {
      if (postId) {
        await updatePost(token, postId, { title, content: body, category, fileUrl: extractFileUrl(body) })
        // 작성/수정을 마친 뒤 뒤로가기로 이 화면에 돌아오지 않도록 히스토리를 치환한다
        router.replace(`/posts/${postId}`)
      } else {
        const res = await createPost(token, { title, content: body, category, fileUrl: extractFileUrl(body) })
        const newId = res.data?.postId
        router.replace(newId ? `/posts/${newId}` : "/community")
      }
    } catch (e) { handleError(e) } finally {
      setSubmitting(false)
    }
  }

  const needsLocation = category === "NEIGHBORHOOD" && locationLoaded && !location
  const isReady = title.trim().length > 0 && content.trim().length > 0 && !!category
    && (category !== "NEIGHBORHOOD" || !!location)

  if (loading) {
    return (
      <div>
        <p className="text-center py-20 text-zinc-400">불러오는 중...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-start justify-between px-20 py-8 gap-8">
        <CommunityMenu />

        <main className="flex flex-col gap-4 w-full">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-zinc-800">{postId ? "글 수정" : "글쓰기"}</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.back()}
                className="px-5 py-2 rounded-lg border border-zinc-300 text-zinc-600 text-sm font-semibold hover:bg-zinc-100"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isReady || submitting}
                className="px-5 py-2 rounded-xl bg-main text-white text-sm font-semibold transition-colors hover:bg-orange-600 disabled:opacity-40 disabled:hover:bg-main disabled:cursor-not-allowed cursor-pointer"
              >
                {submitting ? (postId ? "수정 중..." : "등록 중...") : (postId ? "수정" : "등록")}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-0 w-full border border-zinc-200 rounded-lg overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-200">
              <input
                type="text"
                placeholder="제목을 입력해주세요."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                className="flex-1 text-xl font-semibold focus:outline-none placeholder:text-zinc-300"
              />
              <span className="text-sm text-zinc-400 shrink-0">{title.length} / 100</span>
            </div>

            <div data-color-mode="light">
              <style>{`
                .w-md-editor { border: none !important; box-shadow: none !important; border-radius: 0 !important; }
                .w-md-editor-toolbar { border-bottom: 1px solid #e4e4e7 !important; padding: 6px 0 !important; background: #fafafa !important; }
                .w-md-editor-content { min-height: 400px; }
              `}</style>
              <MDEditor
                value={content}
                onChange={(v) => setContent(v ?? "")}
                height={480}
                preview="edit"
              />
            </div>

            <div className="flex flex-col gap-1 px-6 py-4 border-t border-zinc-200">
              <h1 className="text-xl font-bold">카테고리<span className="text-red-500">*</span></h1>
              <div className="relative">
                <select
                  value={category ?? ""}
                  onChange={(e) => setCategory(isCommunityCategory(e.target.value) ? e.target.value : null)}
                  className="w-full h-10 border border-zinc-300 rounded-lg pl-3 pr-10 text-sm appearance-none transition-colors focus:outline-none focus:border-main hover:border-zinc-400"
                >
                  <option value="">카테고리를 선택해주세요</option>
                  {COMMUNITY_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <IoChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-lg pointer-events-none" />
              </div>
              {category === "NEIGHBORHOOD" && location && (
                <p className="text-sm text-zinc-500">{location.locationName.split(" ")[0]} 주민에게만 보이는 글입니다.</p>
              )}
              {needsLocation && (
                <p className="text-sm text-red-500">동네 주민 글을 쓰려면 프로필에서 지역을 먼저 설정해주세요.</p>
              )}
            </div>

            <div className="flex items-center gap-3 px-6 py-3 border-t border-zinc-200 bg-zinc-50">
              <button
                type="button"
                onClick={handleUploadClick}
                disabled={uploading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-300 bg-white text-zinc-600 text-sm font-semibold hover:bg-zinc-100 disabled:opacity-50"
              >
                <IoImageOutline className="text-lg" />
                {uploading ? "업로드 중..." : "이미지 삽입"}
              </button>
              <span className="text-xs text-zinc-400">에디터에서 삽입할 위치에 커서를 두고 클릭하세요</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
