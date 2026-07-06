export async function uploadFile(token: string, file: File): Promise<{ url: string }> {
  const formData = new FormData()
  formData.append('file', file, file.name)

  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  })
  if (!res.ok) throw new Error('파일 업로드 실패')
  const json = await res.json()
  const fileUrl: string = json.data?.fileUrl ?? json.fileUrl ?? ''
  const url = fileUrl.startsWith('http') ? fileUrl : `${process.env.NEXT_PUBLIC_API_URL}${fileUrl}`
  return { url }
}
