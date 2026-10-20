/** 값이 아직 없을 때 화면에 채우는 자리표시자. */
export const EMPTY = "-"

/** 조회 전이거나 서버가 null 을 준 값도 화면이 비지 않도록 '-' 로 바꾼다. */
export function display(value: string | number | null | undefined) {
    return value === null || value === undefined || value === "" ? EMPTY : String(value)
}
