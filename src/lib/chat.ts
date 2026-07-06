import { throwApiError } from './apiError'

function authHeaders(token?: string | null) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

export async function getChatRooms(token: string) {
  const res = await fetch(`/api/chat/rooms`, {
    headers: authHeaders(token),
  })
  if (!res.ok) await throwApiError(res)
  return res.json()
}

export async function createChatRoom(token: string, username: string) {
  const res = await fetch(`/api/chat/rooms`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ username }),
  })
  if (!res.ok) await throwApiError(res)
  return res.json()
}

export async function getChatMessages(token: string, roomId: number) {
  const res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
    headers: authHeaders(token),
  })
  if (!res.ok) await throwApiError(res)
  return res.json()
}

export async function deleteChatRoom(token: string, roomId: number) {
  const res = await fetch(`/api/chat/rooms/${roomId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  if (!res.ok) await throwApiError(res)
  return res.json()
}
