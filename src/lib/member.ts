import { throwApiError } from './apiError'

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

// 로그인 상태에서 비밀번호 변경. 이미 로그인했으니 인증번호 대신 기존 비밀번호로 본인 확인한다.
// 성공하면 서버가 토큰을 지우므로 호출한 쪽에서 재로그인시켜야 한다
export async function changePassword(token: string, currentPassword: string, newPassword: string) {
  const res = await fetch(`/api/member/password/reset/check`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  })
  if (!res.ok) await throwApiError(res)
  return res.json()
}

// 소셜 가입자처럼 비밀번호가 없는 계정의 최초 설정. 변경과 달리 토큰이 유지돼 재로그인이 필요 없다
export async function setPassword(token: string, newPassword: string) {
  const res = await fetch(`/api/member/password`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ new_password: newPassword }),
  })
  if (!res.ok) await throwApiError(res)
  return res.json()
}

// 이메일 변경 (새 이메일로 받은 인증코드 필요)
export async function changeEmail(
  token: string,
  data: { password: string; newEmail: string; verifyCode: string }
) {
  const res = await fetch(`/api/member/email`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({
      password: data.password,
      new_email: data.newEmail,
      verify_code: data.verifyCode,
    }),
  })
  if (!res.ok) await throwApiError(res)
  return res.json()
}

// 전화번호 변경 (새 번호로 받은 인증코드 필요)
export async function changePhone(
  token: string,
  data: { password: string; newPhone: string; code: string }
) {
  const res = await fetch(`/api/member/phone`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({
      password: data.password,
      new_phone: data.newPhone,
      code: data.code,
    }),
  })
  if (!res.ok) await throwApiError(res)
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
