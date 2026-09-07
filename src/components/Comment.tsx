import { useState } from "react"
import Image from "next/image"

interface CommentProps {
  authorName: string
  content: string
  createdAt: string
  profileImage?: string
  edited?: boolean
  isOwner?: boolean
  onEdit?: (content: string) => Promise<void> | void
  onDelete?: () => Promise<void> | void
}

export default function Comment({ authorName, content, createdAt, profileImage, edited, isOwner, onEdit, onDelete }: CommentProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(content)
  const [submitting, setSubmitting] = useState(false)

  async function handleSave() {
    if (!draft.trim() || !onEdit) return
    setSubmitting(true)
    try {
      await onEdit(draft)
      setEditing(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex gap-2 py-2">
      <div className="w-12 h-12 bg-zinc-400 rounded-full overflow-hidden border border-zinc-300 shrink-0">
        <Image
          src={profileImage ?? "/profile.png"}
          alt="프로필사진"
          className="object-cover"
          width={48}
          height={48}
        />
      </div>
      <div className="flex flex-col gap-1 flex-1">
        <div className="flex items-center justify-between">
          <h3 className="text-md font-bold">{authorName}</h3>
          {isOwner && !editing && (
            <div className="flex gap-2">
              <button onClick={() => { setDraft(content); setEditing(true) }} className="text-xs text-zinc-400 hover:text-zinc-600 cursor-pointer">수정</button>
              <button onClick={() => onDelete?.()} className="text-xs text-red-400 hover:text-red-600 cursor-pointer">삭제</button>
            </div>
          )}
        </div>

        {editing ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault()
                  handleSave()
                }
              }}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2.5 text-sm transition-colors focus:outline-none focus:border-main hover:border-zinc-400 disabled:bg-zinc-100 disabled:text-zinc-500 resize-none"
              rows={2}
            />
            <div className="flex gap-2 self-end">
              <button onClick={() => setEditing(false)} className="text-xs text-zinc-400 hover:text-zinc-600 cursor-pointer">취소</button>
              <button onClick={handleSave} disabled={submitting} className="text-xs text-main font-semibold hover:text-main/80 cursor-pointer disabled:opacity-50">
                {submitting ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm font-medium">{content}</p>
        )}

        <div className="flex gap-2">
          <span className="text-sm font-medium text-zinc-400">{createdAt}</span>
          {edited && <span className="text-xs text-zinc-400">(수정됨)</span>}
          <span className="text-sm font-medium text-zinc-400 cursor-pointer hover:text-zinc-600">답글 쓰기</span>
        </div>
      </div>
    </div>
  )
}
