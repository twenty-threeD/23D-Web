// 수신 벨소리.
//
// 오디오 파일을 두지 않고 WebAudio 로 직접 만든다. 벨은 짧은 두 음의 반복이라
// 파일을 받아오는 것보다 가볍고, 네트워크 상태와 무관하게 즉시 울린다.

let ctx: AudioContext | null = null
let loop: ReturnType<typeof setInterval> | null = null

// 브라우저는 사용자가 페이지를 한 번이라도 건드리기 전에는 소리를 못 내게 막는다.
// 전화가 왔을 때 그제서야 만들면 이미 늦어서 아무 소리도 안 난다.
// 그래서 첫 클릭·키입력 때 미리 만들어 깨워둔다(CallProvider 가 호출).
export function primeRingtone() {
  try {
    ctx = ctx ?? new AudioContext()
    void ctx.resume()
  } catch {
    // WebAudio 를 못 쓰는 환경. 화면 애니메이션으로만 알린다.
  }
}

function beep(at: number, frequency: number) {
  if (!ctx) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = "sine"
  osc.frequency.value = frequency
  // 시작·끝을 뭉개지 않으면 딱딱 끊기는 소리(클릭 노이즈)가 난다
  gain.gain.setValueAtTime(0, at)
  gain.gain.linearRampToValueAtTime(0.18, at + 0.02)
  gain.gain.setValueAtTime(0.18, at + 0.28)
  gain.gain.linearRampToValueAtTime(0, at + 0.34)
  osc.connect(gain).connect(ctx.destination)
  osc.start(at)
  osc.stop(at + 0.36)
}

export function startRingtone() {
  if (loop) return
  primeRingtone()
  if (!ctx) return

  const ring = () => {
    if (!ctx) return
    beep(ctx.currentTime, 880)
    beep(ctx.currentTime + 0.45, 740)
  }
  ring()
  loop = setInterval(ring, 2400)
}

export function stopRingtone() {
  if (loop) {
    clearInterval(loop)
    loop = null
  }
  // AudioContext 는 닫지 않고 재사용한다. 매번 새로 만들면 자동재생 허용이 풀린다.
  void ctx?.suspend()
}
