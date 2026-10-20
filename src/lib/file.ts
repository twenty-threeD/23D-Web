import { throwApiError } from './apiError'
import { compressImage } from './imageCompress'

const BACKEND_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.idta.store'

export function toRelativeUrl(url: string | null | undefined): string {
  if (!url) return ''
  if (url.startsWith(BACKEND_ORIGIN)) return url.slice(BACKEND_ORIGIN.length)
  return url
}

// 프로필 imageUrl, 커뮤니티 글 fileUrl 은 서버가 우리 업로드 경로(/files/<파일명>)만 받고 외부 URL 은 400 으로 막는다.
// 서버가 절대 URL 로 내려준 값도 있어 상대 경로로 바꾼 뒤 확인하고, 형식이 아니면 null 을 돌려 보내지 않게 한다
export function toUploadPath(url: string | null | undefined): string | null {
  const path = toRelativeUrl(url)
  return /^\/files\/[^/?#]+$/.test(path) ? path : null
}

interface UploadOptions {
  /**
   * 이미지를 줄이지 않고 원본 그대로 올린다.
   * 계약서 서명처럼 나중에 pdf-lib 의 embedPng 로 다시 읽는 파일은 PNG 를 유지해야 한다.
   */
  keepOriginal?: boolean
}

export async function uploadFile(
  token: string,
  file: File,
  options: UploadOptions = {}
): Promise<{ url: string }> {
  // 이미지는 여기서 한 번에 줄인다. 업로드 경로가 전부 이 함수를 지나가므로
  // 채팅·프로필·커뮤니티·서비스 등록이 같은 기준을 쓰게 된다. (PDF 는 그대로 통과)
  const payload = options.keepOriginal ? file : await compressImage(file)

  const formData = new FormData()
  formData.append('multipartFile', payload, payload.name)

  const res = await fetch('/api/files/upload', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  })
  if (!res.ok) await throwApiError(res)
  const json = await res.json()
  const fileUrl: string = json.data?.fileUrl ?? json.fileUrl ?? ''
  return { url: toRelativeUrl(fileUrl) }
}
