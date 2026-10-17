import { useState } from "react"
import Image from "next/image"

interface CommentProps {
  authorName: string
  content: string
  createdAt: string
  profileImage?: string
  edited?: boolean
  // 답글이 남은 원댓글을 지우면 자리만 남으므로 흐리게 보이고 손댈 수 없게 한다
  deleted?: boolean
  isOwner?: boolean
  onReply?: () => void
  // 답글에 답한 경우 본문 앞에 붙는 대상 이름. onClick 이 없으면 대상이 사라져 이동할 수 없다
  mention?: { name: string; onClick?: () => void }
  // 멘션 칩으로 찾아올 수 있게 DOM id 를 단다
  domId?: string
  highlighted?: boolean
  onEdit?: (content: string) => Promise<void> | void
  onDelete?: () => Promise<void> | void
}

export default function Comment({ authorName, content, createdAt, profileImage, edited, deleted, isOwner, onReply, mention, domId, highlighted, onEdit, onDelete }: CommentProps) {
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
    <div id={domId} className={`flex gap-2 py-2 rounded-lg ${highlighted ? "animate-comment-highlight" : ""}`}>
      <div className="w-12 h-12 bg-zinc-400 rounded-full overflow-hidden border border-line shrink-0">
        <Image
          src={(!deleted && profileImage) || "/profile.webp"}
          alt="프로필사진"
          className="object-cover"
          width={48}
          height={48}
        />
      </div>
      <div className="flex flex-col gap-1 flex-1">
        <div className="flex items-center justify-between">
          {!deleted && <h3 className="text-md font-bold">{authorName}</h3>}
          {isOwner && !deleted && !editing && (
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
              className="w-full border border-line rounded-lg px-3 py-2.5 text-sm transition-colors focus:outline-none focus:border-main hover:border-zinc-400 disabled:bg-zinc-100 disabled:text-zinc-500 resize-none"
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
          <p className={`text-sm font-medium ${deleted ? "text-zinc-400" : ""}`}>
            {mention && !deleted && (
              mention.onClick ? (
                <button onClick={mention.onClick} className="text-main font-semibold cursor-pointer hover:underline">@{mention.name}</button>
              ) : (
                <span className="text-main font-semibold">@{mention.name}</span>
              )
            )}
            {mention && !deleted && " "}
            {content}
          </p>
        )}

        {!deleted && (
          <div className="flex gap-2">
            <span className="text-sm font-medium text-zinc-400">{createdAt}</span>
            {edited && <span className="text-xs text-zinc-400">(수정됨)</span>}
            {onReply && (
              <button onClick={onReply} className="text-sm font-medium text-zinc-400 cursor-pointer hover:text-zinc-600">답글 쓰기</button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
