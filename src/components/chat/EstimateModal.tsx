"use client"

import { useState } from "react"
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-100 p-6 flex flex-col gap-4">
        <h2 className="text-lg font-bold">견적서 보내기</h2>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-zinc-500">견적 금액</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="flex-1 border border-zinc-300 rounded-lg px-3 py-2 text-sm"
            />
            <span className="text-sm text-zinc-500">원</span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-zinc-500">견적서 파일</label>
          <label className="border border-dashed border-zinc-300 rounded-lg px-3 py-4 text-sm text-zinc-500 text-center cursor-pointer hover:border-main">
            <input type="file" className="hidden" onChange={handleFile} disabled={uploading} />
            {uploading ? "업로드 중..." : fileName || "파일 선택"}
          </label>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-zinc-500 hover:bg-zinc-100 cursor-pointer"
          >
            취소
          </button>
          <button
            onClick={() => onSubmit({ url, totalPay: Number(amount) })}
            disabled={!canSubmit}
            className="px-4 py-2 rounded-lg bg-main text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
          >
            {busy ? "전송 중..." : "보내기"}
          </button>
        </div>
      </div>
    </div>
  )
}
