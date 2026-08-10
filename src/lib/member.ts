function authHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}

// 아이디 중복 확인 (사용 가능하면 정상 반환, 중복이면 throw)
export async function checkUsername(username: string) {
  const params = new URLSearchParams({ username })
  const res = await fetch(`/api/member/check-username?${params}`)
  const json = await res.json()
  if (!res.ok) throw new Error(json?.error?.message ?? '이미 사용 중인 아이디입니다.')
  return json.data as { message: string }
}

// 이메일 중복 확인 (사용 가능하면 정상 반환, 중복이면 throw)
export async function checkEmail(email: string) {
  const params = new URLSearchParams({ email })
  const res = await fetch(`/api/member/check-email?${params}`)
  const json = await res.json()
  if (!res.ok) throw new Error(json?.error?.message ?? '이미 사용 중인 이메일입니다.')
  return json.data as { message: string }
}

// 전화번호 중복 확인 (사용 가능하면 정상 반환, 중복이면 throw)
export async function checkPhone(phone: string) {
  const params = new URLSearchParams({ phone })
  const res = await fetch(`/api/member/check-phone?${params}`)
  const json = await res.json()
  if (!res.ok) throw new Error(json?.error?.message ?? '이미 사용 중인 전화번호입니다.')
  return json.data as { message: string }
}

// 아이디 찾기
export async function getUsername(email: string) {
  const params = new URLSearchParams({ email })
  const res = await fetch(`/api/member/username?${params}`)
  if (!res.ok) throw new Error('아이디 찾기 실패')
  return res.json()
}

// 아이디 재설정
export async function resetUsername(token: string, username: string) {
  const res = await fetch(`/api/member/username/reset`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ username }),
  })
  if (!res.ok) throw new Error('아이디 변경 실패')
  return res.json()
}

// 비밀번호 재설정 인증 확인
export async function checkPasswordReset(email: string, verifyCode: string) {
  const res = await fetch(`/api/member/password/reset/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, verifyCode }),
  })
  if (!res.ok) throw new Error('인증 확인 실패')
  return res.json()
}

// 비밀번호 재설정
export async function resetPassword(email: string, newPassword: string) {
  const res = await fetch(`/api/member/password/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, newPassword }),
  })
  if (!res.ok) throw new Error('비밀번호 변경 실패')
  return res.json()
}

// 회원 탈퇴
export async function deleteAccount(token: string) {
  const res = await fetch(`/api/member/account`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('회원 탈퇴 실패')
  return res.json()
}
