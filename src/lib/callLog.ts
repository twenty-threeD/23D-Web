import type { CallStatus, CallType } from './call'

// 통화 기록을 채팅에 남기기 위한 규약.
//
// 백엔드에 통화 기록 메시지 타입이 없어서, 계약서·결제와 똑같이
// "대괄호 접두사 + JSON" 으로 실어 보내고 받는 쪽에서 말풍선으로 그린다.
//
// 양쪽이 다 보내면 같은 통화가 두 번 찍히므로 발신자(caller)만 남긴다.

export interface CallLog {
  callType: CallType
  status: CallStatus
  durationSeconds: number
}

export const CALL_LOG_PREFIX = '[통화]\n'

export function formatCallLogMessage(log: CallLog): string {
  return `${CALL_LOG_PREFIX}${JSON.stringify(log)}`
}

export function parseCallLog(text: string): CallLog | null {
  if (!text?.startsWith(CALL_LOG_PREFIX)) return null
  try {
    const parsed = JSON.parse(text.slice(CALL_LOG_PREFIX.length))
    if (!parsed?.status) return null
    return {
      callType: parsed.callType === 'VIDEO' ? 'VIDEO' : 'VOICE',
      status: parsed.status,
      durationSeconds: Number(parsed.durationSeconds) || 0,
    }
  } catch {
    return null
  }
}

export function formatCallDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}시간 ${m}분`
  if (m > 0) return `${m}분 ${s}초`
  return `${s}초`
}

export interface CallLogText {
  title: string
  detail: string | null
  // 받는 사람 입장에서 놓친 전화인지. 눈에 띄게 그려야 한다.
  missed: boolean
}

// 같은 통화라도 건 쪽과 받은 쪽의 문구가 다르다.
// 메시지는 발신자만 보내므로 isSent 가 곧 "내가 건 전화"라는 뜻이다.
export function describeCallLog(log: CallLog, isSent: boolean): CallLogText {
  const kind = log.callType === 'VIDEO' ? '영상 통화' : '음성 통화'

  switch (log.status) {
    case 'ENDED':
      return log.durationSeconds > 0
        ? { title: kind, detail: formatCallDuration(log.durationSeconds), missed: false }
        : { title: `${kind} 종료`, detail: null, missed: false }
    case 'MISSED':
      return isSent
        ? { title: `${kind} 응답 없음`, detail: null, missed: false }
        : { title: '부재중 전화', detail: kind, missed: true }
    case 'REJECTED':
      return isSent
        ? { title: `${kind} 거절됨`, detail: null, missed: false }
        : { title: `${kind} 거절함`, detail: null, missed: false }
    case 'CANCELED':
      return isSent
        ? { title: `${kind} 취소함`, detail: null, missed: false }
        : { title: '부재중 전화', detail: kind, missed: true }
    default:
      return { title: kind, detail: null, missed: false }
  }
}

// 채팅 목록 미리보기·알림 본문용 한 줄
export function previewCallLog(log: CallLog): string {
  const kind = log.callType === 'VIDEO' ? '영상 통화' : '음성 통화'
  if (log.status === 'MISSED' || log.status === 'CANCELED') return '부재중 전화'
  if (log.status === 'REJECTED') return `${kind} 거절됨`
  if (log.status === 'ENDED' && log.durationSeconds > 0) {
    return `${kind} ${formatCallDuration(log.durationSeconds)}`
  }
  return `${kind} 종료`
}
