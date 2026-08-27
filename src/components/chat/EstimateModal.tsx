"use client"

import { useState } from "react"
import { IoClose, IoDocumentTextOutline, IoCloudUploadOutline, IoCheckmarkCircle } from "react-icons/io5"
import { uploadFile } from "@/src/lib/file"

interface EstimateModalProps {
  token: string
  totalPay?: number
  busy?: boolean
  onClose: () => void
  onSubmit: (data: { url: string; totalPay: number }) => void
}

export default function EstimateModal({ token, totalPay, busy, onClose, onSubmit }: EstimateModalProps) {
  const [amount, setAmount] = useState(totalPay ? String(totalPay) : "")
  const [url, setUrl] = useState("")
  const [fileName, setFileName] = useState("")
  const [uploading, setUploading] = useState(false)

  const canSubmit = Number(amount) > 0 && url !== "" && !busy && !uploading

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await uploadFile(token, file)
      setUrl(res.url)
      setFileName(file.name)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-100 p-6 flex flex-col gap-5 animate-modal-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <IoDocumentTextOutline className="text-emerald-500 text-lg" />
            </span>
            <h2 className="text-lg font-bold">견적서 보내기</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <IoClose className="text-xl" />
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-600">견적 금액</label>
          <div className="flex items-center gap-2 border border-zinc-300 rounded-xl px-3 py-2.5 focus-within:border-main transition-colors">
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="flex-1 text-sm focus:outline-none"
            />
            <span className="text-sm text-zinc-400">원</span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-600">견적서 파일</label>
          <label
            className={`flex flex-col items-center gap-2 border border-dashed rounded-xl px-3 py-6 text-sm text-center cursor-pointer transition-colors ${
              fileName ? "border-main bg-main/5" : "border-zinc-300 hover:border-main hover:bg-main/5"
            }`}
          >
            <input type="file" className="hidden" onChange={handleFile} disabled={uploading} />
            {uploading ? (
              <span className="text-zinc-400">업로드 중...</span>
            ) : fileName ? (
              <>
                <IoCheckmarkCircle className="text-2xl text-main" />
                <span className="text-zinc-700 font-medium truncate max-w-full">{fileName}</span>
              </>
            ) : (
              <>
                <IoCloudUploadOutline className="text-2xl text-zinc-400" />
                <span className="text-zinc-500">클릭해서 파일 선택</span>
              </>
            )}
          </label>
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm text-zinc-500 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            취소
          </button>
          <button
            onClick={() => onSubmit({ url, totalPay: Number(amount) })}
            disabled={!canSubmit}
            className="px-5 py-2 rounded-xl bg-main text-white text-sm font-semibold hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {busy ? "전송 중..." : "보내기"}
          </button>
        </div>
      </div>
    </div>
  )
}
