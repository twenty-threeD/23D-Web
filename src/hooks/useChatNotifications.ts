"use client"

import { useEffect, useState } from "react"
import { useAuthStore } from "@/src/store/authStore"
import { useChatRoomsStore } from "@/src/store/chatRoomsStore"
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
  const markRoomUnread = useChatRoomsStore((s) => s.markRoomUnread)

  useEffect(() => {
    if (!token) {
      setNotifications([])
      return
    }
    const unsubscribe = subscribeToNotifications(token, {
      onChat: (n) => {
        const isViewingRoom = useChatRoomsStore.getState().activeRoomId === n.roomId
        if (!isViewingRoom) markRoomUnread(n.roomId, n.message)
        setNotifications((prev) => {
          // 같은 사람(방)이 여러 번 보낸 알림은 최신 하나만 남긴다.
          const withoutSameRoom = prev.filter((existing) => existing.roomId !== n.roomId)
          return [{ ...n, id: makeId(), type: "chat" as const, read: isViewingRoom }, ...withoutSameRoom].slice(0, 20)
        })
      },
    })
    return unsubscribe
  }, [token, markRoomUnread])

  function markAsRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  function clearAll() {
    setNotifications([])
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return { notifications, unreadCount, markAsRead, clearAll }
}
