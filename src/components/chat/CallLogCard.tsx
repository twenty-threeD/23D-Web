"use client"

import { MdCall, MdVideocam, MdCallEnd } from "react-icons/md"
import { describeCallLog, type CallLog } from "@/src/lib/callLog"

// 통화가 끝나면 채팅에 남는 기록. 별도 카드가 아니라 말풍선 자리에 들어가므로
// 라운드·최대폭·보낸쪽 색을 일반 말풍선과 똑같이 맞춘다.
// 말풍선 위치(isSent)와 문구 기준(iAmCaller)이 다를 수 있어 따로 받는다.
// onCall 을 넘기면 카드를 눌러 같은 종류(음성·영상)로 다시 걸 수 있다. 부재중 전화에 바로 회신하는 용도다
export default function CallLogCard({
  log,
  isSent,
  iAmCaller,
  onCall,
}: {
  log: CallLog
  isSent: boolean
  iAmCaller: boolean
  onCall?: () => void
}) {
  const { title, detail, missed } = describeCallLog(log, iAmCaller)
  const Icon = missed ? MdCallEnd : log.callType === "VIDEO" ? MdVideocam : MdCall

  return (
    <button
      type="button"
      onClick={onCall}
      disabled={!onCall}
      aria-label={onCall ? `${log.callType === "VIDEO" ? "영상" : "음성"} 통화 다시 걸기` : undefined}
      className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 max-w-[min(20rem,62vw)] text-left transition enabled:cursor-pointer enabled:hover:brightness-95 enabled:active:brightness-90 ${
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
    </button>
  )
}
