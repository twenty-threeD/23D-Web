"use client"

import { useEffect, useState } from "react"
import { useAuthStore } from "@/src/store/authStore"
import { subscribeToNotifications, type ChatNotification } from "@/src/lib/notifications"

export type NotificationType = "chat" | "notice"

export interface Notification extends ChatNotification {
  id: string
  type: NotificationType
  read: boolean
}

let seq = 0
function makeId() {
  seq += 1
  return `${Date.now()}-${seq}`
}

export function useChatNotifications() {
  const token = useAuthStore((s) => s.accessToken)
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    if (!token) {
      setNotifications([])
      return
    }
    const unsubscribe = subscribeToNotifications(token, {
      onChat: (n) =>
        setNotifications((prev) =>
          [{ ...n, id: makeId(), type: "chat" as const, read: false }, ...prev].slice(0, 20)
        ),
    })
    return unsubscribe
  }, [token])

  function markAsRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  function clearAll() {
    setNotifications([])
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return { notifications, unreadCount, markAsRead, clearAll }
}
