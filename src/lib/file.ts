import { throwApiError } from './apiError'
import { compressImage } from './imageCompress'

const BACKEND_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.idta.store'

export function toRelativeUrl(url: string | null | undefined): string {
  if (!url) return ''
  if (url.startsWith(BACKEND_ORIGIN)) return url.slice(BACKEND_ORIGIN.length)
  return url
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
