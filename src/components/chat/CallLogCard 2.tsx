"use client"

import { MdCall, MdVideocam, MdCallEnd } from "react-icons/md"
import { describeCallLog, type CallLog } from "@/src/lib/callLog"

// 통화가 끝나면 채팅에 남는 기록. 별도 카드가 아니라 말풍선 자리에 들어가므로
// 라운드·최대폭·보낸쪽 색을 일반 말풍선과 똑같이 맞춘다.
export default function CallLogCard({ log, isSent }: { log: CallLog; isSent: boolean }) {
  const { title, detail, missed } = describeCallLog(log, isSent)
  const Icon = missed ? MdCallEnd : log.callType === "VIDEO" ? MdVideocam : MdCall

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 max-w-xs ${
        isSent ? "bg-main rounded-br-none text-white" : "bg-zinc-100 rounded-bl-none"
      }`}
    >
      <span
        className={`flex items-center justify-center size-8 shrink-0 rounded-full text-base ${
          isSent
            ? "bg-white/20 text-white"
            : missed
              ? "bg-red-50 text-red-500"
              : "bg-white text-zinc-500"
        }`}
      >
        <Icon />
      </span>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className={`text-sm font-medium ${!isSent && missed ? "text-red-500" : ""}`}>
          {title}
        </span>
        {detail && (
          <span className={`text-xs ${isSent ? "text-white/70" : "text-zinc-400"}`}>{detail}</span>
        )}
      </div>
    </div>
  )
}
