const BASE = process.env.NEXT_PUBLIC_API_URL

function authHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}

// 아이디 찾기
export async function getUsername(email: string) {
  const params = new URLSearchParams({ email })
  const res = await fetch(`${BASE}/api/member/username?${params}`, {
    credentials: 'include',
  })
  if (!res.ok) throw new Error('아이디 찾기 실패')
  return res.json()
}

// 아이디 재설정
export async function resetUsername(token: string, username: string) {
  const res = await fetch(`${BASE}/api/member/username/reset`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(token),
    body: JSON.stringify({ username }),
  })
  if (!res.ok) throw new Error('아이디 변경 실패')
  return res.json()
}

// 비밀번호 재설정 인증 확인
export async function checkPasswordReset(email: string, verifyCode: string) {
  const res = await fetch(`${BASE}/api/member/password/reset/check`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, verifyCode }),
  })
  if (!res.ok) throw new Error('인증 확인 실패')
  return res.json()
}

// 비밀번호 재설정
export async function resetPassword(email: string, newPassword: string) {
  const res = await fetch(`${BASE}/api/member/password/reset`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, newPassword }),
  })
  if (!res.ok) throw new Error('비밀번호 변경 실패')
  return res.json()
}

// 회원 탈퇴
export async function deleteAccount(token: string) {
  const res = await fetch(`${BASE}/api/member/account`, {
    method: 'DELETE',
    credentials: 'include',
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('회원 탈퇴 실패')
  return res.json()
}
