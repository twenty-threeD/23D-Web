// 인증코드 전송
export async function sendVerifyCode(email: string) {
  const res = await fetch(`/api/email/code/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  if (!res.ok) throw new Error('인증코드 전송 실패')
  return res.json()
}

// 인증코드 확인
export async function checkVerifyCode(email: string, verifyCode: string) {
  const res = await fetch(`/api/email/code/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, verifyCode }),
  })
  if (!res.ok) throw new Error('인증코드 불일치')
  return res.json()
}

// 이메일 변경용 인증코드 전송 (새 이메일로 발송)
export async function sendEmailChangeCode(email: string) {
  const res = await fetch(`/api/email/change/code/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  if (!res.ok) throw new Error('인증코드 전송 실패')
  return res.json()
}

// 전화번호 인증코드 전송
export async function sendPhoneVerifyCode(phone: string) {
  const res = await fetch(`/phone/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(phone),
  })
  if (!res.ok) throw new Error('인증코드 전송 실패')
  return res.json()
}

// 전화번호 인증코드 확인
export async function checkPhoneVerifyCode(phone: string, code: string) {
  const res = await fetch(`/phone/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipientNumber: phone, code }),
  })
  if (!res.ok) throw new Error('인증코드 불일치')
  return res.json()
}

// 회원가입
export async function signup(
  name: string,
  username: string,
  email: string,
  password: string,
  phone?: string
) {
  const res = await fetch(`/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      username,
      email,
      password,
      ...(phone ? { phone } : {}),
      role: 'USER',
      provider: 'AUTH'
    }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err?.error?.message ?? '회원가입에 실패했습니다.')
  }
  return res.json()
}

// 로그인
export async function login(email: string, password: string) {
  const res = await fetch(`/api/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err?.error?.message ?? '로그인에 실패했습니다.')
  }
  const json = await res.json()
  return json.data
}

// 액세스 토큰 재발급
// 리프레시 토큰은 서버가 심은 쿠키로 전달되므로 body 없이 호출한다
export async function reissueToken() {
  const res = await fetch(`/api/token/reissue`, {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('토큰 재발급에 실패했습니다.')
  const json = await res.json()
  const accessToken = json?.data?.accessToken
  if (!accessToken) throw new Error('토큰 재발급에 실패했습니다.')
  return accessToken as string
}

// 로그아웃
export async function logout(token?: string | null) {
  await fetch(`/api/auth/signout`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

// 현재 비밀번호 확인 (일치 여부를 boolean 으로 돌려준다)
export async function verifyPassword(token: string, password: string) {
  const res = await fetch(`/api/auth/verify/password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ password }),
  })
  if (!res.ok) throw new Error('비밀번호 확인에 실패했습니다.')
  const json = await res.json()
  // 응답이 boolean 그대로 오거나 공통 래퍼에 담겨 올 수 있다
  return (typeof json === 'boolean' ? json : json?.data) === true
}
