// 랜딩 첫 화면(이미지 시퀀스)이 화면을 차지하는 동안에는 위아래를 검은 레터박스로만 두고 헤더를 숨긴다.
// 헤더는 시퀀스가 끝나야 나와야 해서, 영상 섹션이 이 이벤트로 지금 첫 화면 구간인지 알린다.
export const LETTERBOX_EVENT = "itda:letterbox"

export interface LetterboxDetail {
  /** true 면 아직 첫 화면 구간(헤더 숨김), false 면 시퀀스가 끝난 뒤 */
  active: boolean
}

export function emitLetterbox(active: boolean) {
  window.dispatchEvent(
    new CustomEvent<LetterboxDetail>(LETTERBOX_EVENT, { detail: { active } })
  )
}
