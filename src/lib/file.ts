import { throwApiError } from './apiError'

const BACKEND_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.idta.store'

export function toRelativeUrl(url: string | null | undefined): string {
  if (!url) return ''
  if (url.startsWith(BACKEND_ORIGIN)) return url.slice(BACKEND_ORIGIN.length)
  return url
}

export async function uploadFile(token: string, file: File): Promise<{ url: string }> {
  const formData = new FormData()
  formData.append('multipartFile', file, file.name)

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
