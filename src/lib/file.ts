import { throwApiError } from './apiError'

const BACKEND_ORIGIN = 'http://13.125.161.66:8080'

export function toRelativeUrl(url: string | null | undefined): string {
  if (!url) return ''
  if (url.startsWith(BACKEND_ORIGIN)) return url.slice(BACKEND_ORIGIN.length)
  return url
}

export async function uploadFile(token: string, file: File): Promise<{ url: string }> {
  const formData = new FormData()
  formData.append('file', file, file.name)

  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  })
  if (!res.ok) await throwApiError(res)
  const json = await res.json()
  const fileUrl: string = json.data?.fileUrl ?? json.fileUrl ?? ''
  return { url: toRelativeUrl(fileUrl) }
}
