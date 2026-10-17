// 통화 소리. 벨소리(약 5.5초)는 받거나 끊을 때까지 이어서 반복하고, 종료음은 한 번 울린다.
const RINGTONE_SRC = "/idta-ringtone.mp3"
const HANGUP_SRC = "/idta-calloff.mp3"

let ringtone: HTMLAudioElement | null = null
let hangup: HTMLAudioElement | null = null
// 벨이 울려야 하는 중인지. 자동재생 허용을 풀려고 소리 없이 재생했다 멈추는 동안 벨이 오면 멈추지 않게 본다
let ringing = false
// 두 소리 모두 한 번 재생에 성공했는지. 성공해야 이후 전화가 왔을 때 스크립트로 울릴 수 있다
let unlocked = false

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

// 0.1초 무음 WAV. 풀어둘 때 실제 벨소리 대신 이걸 소리 켠 채로 재생한다.
// blob URL 로 만들면 재생을 마치고 원래 src 로 되돌린 뒤 해제해도 크롬이 해제된 blob 을 한 번 더 읽으려다
// ERR_FILE_NOT_FOUND 를 콘솔에 남긴다(첫 클릭마다 audio 요소 수만큼). 해제할 필요가 없는 data URL 로 만든다
let silentUrl: string | null = null
function silentWavUrl() {
  if (silentUrl) return silentUrl
  const samples = 4410
  const buffer = new ArrayBuffer(44 + samples * 2)
  const view = new DataView(buffer)
  const text = (offset: number, value: string) => [...value].forEach((ch, i) => view.setUint8(offset + i, ch.charCodeAt(0)))
  text(0, "RIFF"); view.setUint32(4, 36 + samples * 2, true); text(8, "WAVE")
  text(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true)
  view.setUint32(24, 44100, true); view.setUint32(28, 88200, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true)
  text(36, "data"); view.setUint32(40, samples * 2, true)
  let binary = ""
  new Uint8Array(buffer).forEach((byte) => { binary += String.fromCharCode(byte) })
  silentUrl = `data:audio/wav;base64,${btoa(binary)}`
  return silentUrl
}

// 브라우저(특히 iOS 사파리)는 사용자가 누른 동작 안에서 한 번 재생된 audio 요소만 나중에 스크립트로 재생할 수 있다.
// 전화가 오는 순간에는 누른 동작이 없으므로, 페이지에서 누를 때 미리 한 번 재생해 풀어둔다(CallProvider 가 호출).
//
// - 소리를 끈(muted) 재생은 사파리가 동작 없이도 허용해서, 그걸로는 풀렸는지 알 수 없다.
//   그래서 같은 요소에 무음 소리를 소리 켠 채로 재생해 보고, 성공했을 때만 풀린 것으로 본다
// - 사파리는 터치의 pointerdown 을 사용자 동작으로 쳐주지 않아 그때는 실패한다. 성공할 때까지 다음 동작에서 다시 시도한다
export async function primeRingtone(): Promise<boolean> {
  if (unlocked) return true
  ensureAudio()
  // 사용자 동작 안이 아니면 시도해도 실패하므로 건너뛴다 (지원하는 브라우저에서만 확인 가능)
  const activation = (navigator as Navigator & { userActivation?: { isActive: boolean } }).userActivation
  if (activation && !activation.isActive) return false

  const silent = silentWavUrl()
  const results = await Promise.all(
    [ringtone, hangup].map(async (audio) => {
      if (!audio) return false
      if (audio === ringtone && ringing) return true
      const src = audio.src
      audio.src = silent
      try {
        await audio.play()
        audio.pause()
        return true
      } catch {
        return false
      } finally {
        // 벨이 그 사이 시작됐다면 startRingtone 이 이미 원래 소리로 되돌려 재생 중이다
        if (!(audio === ringtone && ringing)) {
          audio.src = src
          audio.load()
        }
      }
    }),
  )
  unlocked = results.every(Boolean)
  return unlocked
}

export function startRingtone() {
  ensureAudio()
  if (!ringtone || ringing) return
  ringing = true
  // 풀어두는 중이라 무음 소리가 걸려 있을 수 있어 원래 파일로 맞춘다
  if (!ringtone.src.endsWith(RINGTONE_SRC)) ringtone.src = RINGTONE_SRC
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
  if (!hangup.src.endsWith(HANGUP_SRC)) hangup.src = HANGUP_SRC
  hangup.currentTime = 0
  void hangup.play().catch(() => {})
}
