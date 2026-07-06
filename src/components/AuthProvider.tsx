'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/src/store/authStore'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.accessToken)

  useEffect(() => {
    if (token) {
      document.cookie = `accessToken=${token}; path=/; SameSite=Lax`
    }
  }, [token])

  return <>{children}</>
}