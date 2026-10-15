// 통화 소리. 벨소리(약 5.5초)는 받거나 끊을 때까지 이어서 반복하고, 종료음은 한 번 울린다.
const RINGTONE_SRC = "/idta-ringtone.mp3"
const HANGUP_SRC = "/idta-calloff.mp3"

let ringtone: HTMLAudioElement | null = null
let hangup: HTMLAudioElement | null = null
// 벨이 울려야 하는 중인지. 자동재생 허용을 풀려고 소리 없이 재생했다 멈추는 동안 벨이 오면 멈추지 않게 본다
let ringing = false

function createAudio(src: string, loop: boolean) {
  const audio = new Audio(src)
  audio.loop = loop
  audio.preload = "auto"
  return audio
}

function ensureAudio() {
  if (typeof window === "undefined") return
  ringtone ??= createAudio(RINGTONE_SRC, true)
  hangup ??= createAudio(HANGUP_SRC, false)
}

// 브라우저(특히 iOS 사파리)는 사용자가 누른 동작 안에서 한 번 재생된 audio 만 나중에 스크립트로 재생할 수 있다.
// 전화가 오는 순간에는 누른 동작이 없으므로, 페이지에서 처음 누를 때 소리 없이 한 번 재생했다 멈춰 풀어둔다(CallProvider 가 호출)
export function primeRingtone() {
  ensureAudio()
  for (const audio of [ringtone, hangup]) {
    if (!audio || (audio === ringtone && ringing)) continue
    audio.muted = true
    void audio
      .play()
      .then(() => {
        if (audio === ringtone && ringing) {
          audio.muted = false
          return
        }
        audio.pause()
        audio.currentTime = 0
        audio.muted = false
      })
      .catch(() => {
        audio.muted = false
      })
  }
}

export function startRingtone() {
  ensureAudio()
  if (!ringtone || ringing) return
  ringing = true
  ringtone.currentTime = 0
  ringtone.muted = false
  // 자동재생이 막혀 있으면 소리 없이 넘어간다. 벨 화면 애니메이션으로는 알 수 있다
  void ringtone.play().catch(() => {})
}

export function stopRingtone() {
  ringing = false
  if (!ringtone) return
  ringtone.pause()
  ringtone.currentTime = 0
}

export function playHangupTone() {
  ensureAudio()
  if (!hangup) return
  hangup.currentTime = 0
  void hangup.play().catch(() => {})
}
