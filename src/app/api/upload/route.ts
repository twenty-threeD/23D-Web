import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.idta.store'

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')
  const incoming = await req.formData()
  const file = incoming.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'no file' }, { status: 400 })
  }

  const outForm = new FormData()
  outForm.append('multipartFile', file, file.name)

  let res: Response
  try {
    res = await fetch(`${API_URL}/api/files/upload`, {
      method: 'POST',
      headers: token ? { Authorization: token } : {},
      body: outForm,
    })
  } catch (error) {
    console.error('File upload proxy request failed:', error)
    return NextResponse.json({ error: '파일 업로드 서버에 연결할 수 없습니다.' }, { status: 502 })
  }

  const text = await res.text()

  try {
    return NextResponse.json(JSON.parse(text), { status: res.status })
  } catch {
    return NextResponse.json({ error: text }, { status: res.status })
  }
}
