import type { CallStatus, CallType } from './call'

// 통화 기록 말풍선.
//
// 통화가 끝나면 서버가 type: 'CALL' 메시지를 직접 남기고 message.call 에 내용을 실어준다.
// 예전에는 프론트(발신자)가 "[통화]\n{JSON}" 메시지를 보냈는데, 지금도 보내면 기록이 두 번 남으므로 보내지 않는다.
// 다만 그 시절 대화 기록에는 접두사 메시지가 남아 있어 읽기(parseCallLog)는 유지한다.

export interface CallLog {
  callType: CallType
  status: CallStatus
  durationSeconds: number
}

// 서버가 CALL 메시지에 실어주는 통화 정보
export interface ChatCall extends CallLog {
  callerUsername: string
}

const CALL_LOG_PREFIX = '[통화]\n'

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
// 서버 CALL 메시지는 보낸 사람이 아니라 callerUsername 으로 건 쪽을 알려주므로 그걸로 판단한다.
export function describeCallLog(log: CallLog, iAmCaller: boolean): CallLogText {
  const kind = log.callType === 'VIDEO' ? '영상 통화' : '음성 통화'

  switch (log.status) {
    case 'ENDED':
      return log.durationSeconds > 0
        ? { title: kind, detail: formatCallDuration(log.durationSeconds), missed: false }
        : { title: `${kind} 종료`, detail: null, missed: false }
    case 'MISSED':
      return iAmCaller
        ? { title: `${kind} 응답 없음`, detail: null, missed: false }
        : { title: '부재중 전화', detail: kind, missed: true }
    case 'REJECTED':
      return iAmCaller
        ? { title: `${kind} 거절됨`, detail: null, missed: false }
        : { title: `${kind} 거절함`, detail: null, missed: false }
    case 'CANCELED':
      return iAmCaller
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
