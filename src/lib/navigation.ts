// 로그인 화면으로 보낼 때 "원래 있던 곳"을 함께 넘긴다.
// 로그인 후 useRedirectIfAuthed 가 이 값을 읽어 그 자리로 돌려보낸다.
// (예전에는 어디서 튕겼든 로그인 후 무조건 /main 으로 떨어졌다.)
export const SIGNIN_PATH = '/login/signin'

export function signinPath(from?: string): string {
  const target =
    from ??
    (typeof window !== 'undefined' ? window.location.pathname + window.location.search : '')

  // 로그인/가입 화면 자체를 돌아갈 곳으로 기억하면 제자리를 맴돈다
  if (!target || target.startsWith('/login') || target.startsWith('/oauth')) return SIGNIN_PATH

  return `${SIGNIN_PATH}?redirect=${encodeURIComponent(target)}`
}
