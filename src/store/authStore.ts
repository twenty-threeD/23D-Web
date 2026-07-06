import { create } from 'zustand'
import { persist } from 'zustand/middleware'

function decodeJwtUsername(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.username ?? payload.sub ?? null
  } catch {
    return null
  }
}

interface AuthStore {
  accessToken: string | null
  username: string | null
  setToken: (token: string | null) => void
  clear: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      accessToken: null,
      username: null,
      setToken: (token) => {
        if (typeof document !== 'undefined') {
          if (token) {
            document.cookie = `accessToken=${token}; path=/; SameSite=Lax`
          } else {
            document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
          }
        }
        set({ accessToken: token, username: token ? decodeJwtUsername(token) : null })
      },
      clear: () => {
        if (typeof document !== 'undefined') {
          document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        }
        set({ accessToken: null, username: null })
      },
    }),
    { name: 'auth-storage' }
  )
)
