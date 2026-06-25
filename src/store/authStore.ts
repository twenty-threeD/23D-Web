import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthStore {
  accessToken: string | null
  setToken: (token: string | null) => void
  clear: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      accessToken: null,
      setToken: (token) => set({ accessToken: token }),
      clear: () => set({ accessToken: null }),
    }),
    { name: 'auth-storage' }
  )
)
