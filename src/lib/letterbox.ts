// 랜딩 첫 화면의 레터박스는 두 조각으로 나뉘어 있다.
// 위 띠는 LandingHeader, 아래 띠(+문구)는 ImageSequence 가 그린다.
// 둘이 같은 순간에 같이 물러나야 해서, 영상 섹션이 이 이벤트로 상태를 알린다.
export const LETTERBOX_EVENT = "itda:letterbox"

export interface LetterboxDetail {
  /** true 면 레터박스가 펼쳐진 상태(첫 화면), false 면 물러난 상태 */
  active: boolean
}

export function emitLetterbox(active: boolean) {
  window.dispatchEvent(
    new CustomEvent<LetterboxDetail>(LETTERBOX_EVENT, { detail: { active } })
  )
}
