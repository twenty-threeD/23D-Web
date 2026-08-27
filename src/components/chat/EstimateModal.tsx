"use client"

import { useState } from "react"
import { IoCloudUploadOutline, IoCheckmarkCircle } from "react-icons/io5"
import { uploadFile } from "@/src/lib/file"
import Modal, { ModalActions } from "@/src/components/ui/Modal"
import Button from "@/src/components/ui/Button"
import Field, { inputShellClass } from "@/src/components/ui/Field"

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
    <Modal title="견적서 보내기" width="md" onClose={onClose}>
      <Field label="견적 금액">
        <div className={inputShellClass}>
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
      </Field>

      <Field label="견적서 파일">
        <label
          className={`flex flex-col items-center gap-2 border border-dashed rounded-lg px-3 py-6 text-sm text-center cursor-pointer transition-colors ${
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
      </Field>

      <ModalActions>
        <Button variant="ghost" onClick={onClose}>취소</Button>
        <Button onClick={() => onSubmit({ url, totalPay: Number(amount) })} disabled={!canSubmit}>
          {busy ? "전송 중..." : "보내기"}
        </Button>
      </ModalActions>
    </Modal>
  )
}
