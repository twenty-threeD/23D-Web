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

// 통화 종료음.
//
// 두 음을 따로 치면 "알림"처럼 들려서 끊기는 느낌이 안 난다.
// 하나의 음이 아래로 미끄러지면서(피치 하강) 여운을 남기고 사라져야 끝맺음으로 들린다.
// 소리를 손보려면 이 네 줄의 숫자만 만지면 된다.
const HANGUP_FROM_HZ = 988 // 시작 음 (B5)
const HANGUP_TO_HZ = 494 // 한 옥타브 아래로 떨어뜨린다
const HANGUP_GLIDE_SEC = 0.13 // 떨어지는 데 걸리는 시간. 짧을수록 딱 끊기는 느낌
const HANGUP_TAIL_SEC = 0.32 // 여운이 사라지기까지

export function playHangupTone() {
  primeRingtone()
  if (!ctx) return
  const c = ctx

  const schedule = () => {
    const at = c.currentTime
    const osc = c.createOscillator()
    const gain = c.createGain()
    // sine 은 너무 맑아서 밋밋하다. triangle 이 배음이 조금 있어 "띵" 하고 울린다.
    osc.type = "triangle"

    osc.frequency.setValueAtTime(HANGUP_FROM_HZ, at)
    // 사람 귀는 음높이를 비율로 듣는다. 선형으로 내리면 뚝 떨어지듯 부자연스럽다.
    osc.frequency.exponentialRampToValueAtTime(HANGUP_TO_HZ, at + HANGUP_GLIDE_SEC)

    gain.gain.setValueAtTime(0, at)
    gain.gain.linearRampToValueAtTime(0.16, at + 0.01)
    // 0 으로는 exponential 이 안 간다. 들리지 않을 만큼만 작게 보낸다.
    gain.gain.exponentialRampToValueAtTime(0.0001, at + HANGUP_TAIL_SEC)

    osc.connect(gain).connect(c.destination)
    osc.start(at)
    osc.stop(at + HANGUP_TAIL_SEC + 0.02)
  }

  // 벨을 멈추면서 컨텍스트를 재워두기 때문에, 깨어난 뒤에 소리를 잡아야 한다.
  // 잠든 상태로 예약하면 시계가 멈춰 있어 타이밍이 어긋난다.
  if (c.state === "suspended") {
    void c.resume().then(schedule).catch(() => {})
    return
  }
  schedule()
}

export function stopRingtone() {
  if (loop) {
    clearInterval(loop)
    loop = null
  }
  // AudioContext 는 닫지 않고 재사용한다. 매번 새로 만들면 자동재생 허용이 풀린다.
  void ctx?.suspend()
}
