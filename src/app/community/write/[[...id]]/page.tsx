"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import dynamic from "next/dynamic"
import Header from "@/src/components/Header"
import Footer from "@/src/components/Footer"
import CommunityMenu from "@/src/components/CommunitySideBar"
import { IoImageOutline } from "react-icons/io5"
import { getPost, createPost, updatePost } from "@/src/lib/community"
import { uploadFile } from "@/src/lib/file"
import { useAuthStore } from "@/src/store/authStore"
import { useHandleError } from "@/src/hooks/useHandleError"

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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cursorPosRef = useRef<number>(0)

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
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
      setContent(data.content ?? "")
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

  async function handleSubmit() {
    if (!token) { router.push("/login/signin"); return }
    if (!title.trim() || !content.trim()) return
    setSubmitting(true)
    try {
      if (postId) {
        await updatePost(token, postId, { title, content })
        router.push(`/posts/${postId}`)
      } else {
        const res = await createPost(token, { title, content })
        const newId = res.data?.postId
        router.push(newId ? `/posts/${newId}` : "/community")
      }
    } catch (e) { handleError(e) } finally {
      setSubmitting(false)
    }
  }

  const isReady = title.trim().length > 0 && content.trim().length > 0

  if (loading) {
    return (
      <div>
        <Header />
        <p className="text-center py-20 text-zinc-400">불러오는 중...</p>
        <Footer />
      </div>
    )
  }

  return (
    <div>
      <Header />
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
      <Footer />
    </div>
  )
}
