import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')
  const incoming = await req.formData()
  const file = incoming.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'no file' }, { status: 400 })
  }

  const outForm = new FormData()
  outForm.append('multipartFile', file, file.name)

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/files/upload`, {
    method: 'POST',
    headers: token ? { Authorization: token } : {},
    body: outForm,
  })

  const text = await res.text()
  console.log('[upload proxy]', res.status, text)

  try {
    return NextResponse.json(JSON.parse(text), { status: res.status })
  } catch {
    return NextResponse.json({ error: text }, { status: res.status })
  }
}
