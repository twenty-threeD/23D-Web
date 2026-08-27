"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import dynamic from "next/dynamic"
import Header from "@/src/components/Header"
import Footer from "@/src/components/Footer"
import JobMenu from "@/src/components/JobSideBar"
import { IoImageOutline } from "react-icons/io5"
import { getJobPost, createJobPost, updateJobPost } from "@/src/lib/jobs"
import { getPostCategories, type PostCategory } from "@/src/lib/post"
import {
  parseJobContent,
  isJobContentComplete,
  EMPTY_JOB_CONTENT,
  type JobPostContent,
} from "@/src/types/jobPost"
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
  const [job, setJob] = useState<JobPostContent>(EMPTY_JOB_CONTENT)
  const [categories, setCategories] = useState<PostCategory[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(!!postId)

  function patchJob(patch: Partial<JobPostContent>) {
    setJob((prev) => ({ ...prev, ...patch }))
  }

  useEffect(() => {
    getPostCategories().then(setCategories).catch(() => {})
  }, [])

  const fetchPost = useCallback(async () => {
    if (!postId) return
    setLoading(true)
    try {
      const res = await getJobPost(postId, token)
      const data = res.data ?? res
      if (data.username && myUsername && data.username !== myUsername) {
        router.replace(`/jobs/post/${postId}`)
        return
      }
      setTitle(data.title ?? "")
      setJob(parseJobContent(data.content ?? ""))
    } catch (e) {
      handleError(e)
      router.replace("/jobs")
    } finally {
      setLoading(false)
    }
  }, [postId, token, myUsername])

  useEffect(() => { fetchPost() }, [fetchPost])

  function handleUploadClick() {
    const ta = document.querySelector(".w-md-editor-text-input") as HTMLTextAreaElement | null
    if (ta) cursorPosRef.current = ta.selectionStart ?? job.description.length
    fileInputRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length || !token) return
    setUploading(true)

    let insertPos = cursorPosRef.current
    let newContent = job.description

    for (const file of files) {
      try {
        const { url } = await uploadFile(token, file)
        const md = `![image](${url})\n`
        newContent = newContent.slice(0, insertPos) + md + newContent.slice(insertPos)
        insertPos += md.length
      } catch (e) { handleError(e) }
    }

    patchJob({ description: newContent })
    setUploading(false)
    e.target.value = ""
  }

  async function handleSubmit() {
    if (!token) { router.push("/login/signin"); return }
    if (!isReady) return
    setSubmitting(true)
    try {
      if (postId) {
        await updateJobPost(token, postId, { title, job })
        router.push(`/jobs/post/${postId}`)
      } else {
        const res = await createJobPost(token, { title, job })
        const newId = res.data?.postId
        router.push(newId ? `/jobs/post/${newId}` : "/jobs")
      }
    } catch (e) { handleError(e) } finally {
      setSubmitting(false)
    }
  }

  const isReady = title.trim().length > 0 && isJobContentComplete(job)

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
        <JobMenu />

        <main className="flex flex-col gap-4 w-full">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-zinc-800">{postId ? "의뢰 수정" : "의뢰 등록"}</h1>
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
                className="px-5 py-2 rounded-lg bg-main text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed"
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

            {/* 구인구직 필수 항목 */}
            <div className="grid grid-cols-2 gap-4 px-6 py-5 border-b border-zinc-200 bg-zinc-50">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-zinc-600">
                  카테고리 <span className="text-main">*</span>
                </label>
                <select
                  value={job.categoryId ?? ""}
                  onChange={(e) => {
                    const id = e.target.value ? Number(e.target.value) : null
                    const name = categories.find((c) => c.id === id)?.name ?? ""
                    patchJob({ categoryId: id, categoryName: name })
                  }}
                  className="border border-zinc-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-main"
                >
                  <option value="">카테고리를 선택해주세요</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-zinc-600">
                  희망 가격 <span className="text-main">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="500,000"
                    value={job.budget}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/[^\d]/g, "")
                      patchJob({ budget: digits ? Number(digits).toLocaleString() : "" })
                    }}
                    className="flex-1 border border-zinc-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-main"
                  />
                  <span className="text-sm text-zinc-500 shrink-0">원</span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-zinc-600">
                  희망 시공날짜 <span className="text-main">*</span>
                </label>
                <input
                  type="date"
                  value={job.desiredDate}
                  onChange={(e) => patchJob({ desiredDate: e.target.value })}
                  className="border border-zinc-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-main"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-zinc-600">
                  위치 <span className="text-zinc-400 font-normal">(선택)</span>
                </label>
                <input
                  type="text"
                  placeholder="예) 서울시 강남구"
                  value={job.location ?? ""}
                  onChange={(e) => patchJob({ location: e.target.value || null })}
                  className="border border-zinc-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-main"
                />
              </div>
            </div>

            <div className="px-6 pt-4 pb-1">
              <label className="text-sm font-semibold text-zinc-600">
                원하는 서비스 설명 <span className="text-main">*</span>
              </label>
            </div>

            <div data-color-mode="light">
              <style>{`
                .w-md-editor { border: none !important; box-shadow: none !important; border-radius: 0 !important; }
                .w-md-editor-toolbar { border-bottom: 1px solid #e4e4e7 !important; padding: 6px 0 !important; background: #fafafa !important; }
                .w-md-editor-content { min-height: 400px; }
              `}</style>
              <MDEditor
                value={job.description}
                onChange={(v) => patchJob({ description: v ?? "" })}
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

          {!isReady && (
            <p className="text-sm text-zinc-400">
              제목, 카테고리, 희망 가격, 희망 시공날짜, 서비스 설명은 필수입니다. 위치는 선택입니다.
            </p>
          )}
        </main>
      </div>
      <Footer />
    </div>
  )
}
