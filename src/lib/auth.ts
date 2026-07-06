const BASE = process.env.NEXT_PUBLIC_API_URL

// 인증코드 전송
export async function sendVerifyCode(email: string) {
  const res = await fetch(`${BASE}/api/email/code/send`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  if (!res.ok) throw new Error('인증코드 전송 실패')
  return res.json()
}

// 인증코드 확인
export async function checkVerifyCode(email: string, verifyCode: string) {
  const res = await fetch(`${BASE}/api/email/code/verify`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, verifyCode }),
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
  const res = await fetch(`${BASE}/api/auth/signup`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name, 
      username, 
      email, 
      password, 
      phone,
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
  const res = await fetch(`${BASE}/api/auth/signin`, {
    method: 'POST',
    credentials: 'include',
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

// 로그아웃
export async function logout() {
  await fetch(`${BASE}/api/auth/signout`, {
    method: 'POST',
    credentials: 'include',
  })
}