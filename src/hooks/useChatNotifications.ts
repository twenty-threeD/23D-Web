"use client"

import { useEffect, useState } from "react"
import { useAuthStore } from "@/src/store/authStore"
import { subscribeToNotifications, type ChatNotification } from "@/src/lib/notifications"

export function useChatNotifications() {
  const token = useAuthStore((s) => s.accessToken)
  const [notifications, setNotifications] = useState<ChatNotification[]>([])

  useEffect(() => {
    if (!token) {
      setNotifications([])
      return
    }
    const unsubscribe = subscribeToNotifications(token, {
      onChat: (n) => setNotifications((prev) => [n, ...prev].slice(0, 20)),
    })
    return unsubscribe
  }, [token])

  function clear() {
    setNotifications([])
  }

  return { notifications, unreadCount: notifications.length, clear }
}
