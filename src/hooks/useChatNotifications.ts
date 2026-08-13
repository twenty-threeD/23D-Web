"use client"

import { useCallback, useEffect, useState } from "react"
import { useAuthStore } from "@/src/store/authStore"
import { useChatRoomsStore } from "@/src/store/chatRoomsStore"
import {
  subscribeToNotifications,
  getNotifications,
  readNotification,
  readAllNotifications,
  type NotificationResponse,
} from "@/src/lib/notifications"

export type NotificationType = "chat" | "notice"

export interface Notification {
  id: number
  type: NotificationType
  senderName: string
  message: string
  createdAt: string
  roomId: number | null
}

function toNotification(n: NotificationResponse): Notification {
  return {
    id: n.notificationId ?? -Date.now(),
    type: n.type === "NOTICE" ? "notice" : "chat",
    senderName: n.senderName ?? "공지",
    message: n.message,
    createdAt: n.sentAt,
    roomId: n.roomId,
  }
}

// 같은 방에서 온 채팅 알림은 최신 것만 남기고, 밀려난 나머지는 서버에도 읽음 처리한다.
function dedupeByRoom(list: Notification[]): { kept: Notification[]; staleIds: number[] } {
  const seenRooms = new Set<number>()
  const kept: Notification[] = []
  const staleIds: number[] = []
  for (const n of list) {
    if (n.type === "chat" && n.roomId !== null) {
      if (seenRooms.has(n.roomId)) {
        staleIds.push(n.id)
        continue
      }
      seenRooms.add(n.roomId)
    }
    kept.push(n)
  }
  return { kept, staleIds }
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

    getNotifications(token)
      .then((list) => {
        const { kept, staleIds } = dedupeByRoom(list.map(toNotification))
        setNotifications(kept)
        staleIds.forEach((id) => {
          if (id > 0) readNotification(token, id).catch(() => {})
        })
      })
      .catch(() => {})

    const unsubscribe = subscribeToNotifications(token, {
      onNotification: (raw) => {
        const n = toNotification(raw)

        if (n.type === "chat" && n.roomId !== null) {
          const isViewingRoom = useChatRoomsStore.getState().activeRoomId === n.roomId
          if (isViewingRoom) {
            // 이미 보고 있는 방이면 벨 알림에 쌓아두지 않고 바로 읽음 처리한다.
            if (n.id > 0) readNotification(token, n.id).catch(() => {})
            return
          }
          markRoomUnread(n.roomId, n.message)
        }

        setNotifications((prev) => {
          const withoutSameRoom =
            n.type === "chat" && n.roomId !== null
              ? prev.filter((existing) => existing.roomId !== n.roomId)
              : prev
          return [n, ...withoutSameRoom]
        })
      },
    })
    return unsubscribe
  }, [token, markRoomUnread])

  const markAsRead = useCallback(
    (id: number) => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      if (token && id > 0) readNotification(token, id).catch(() => {})
    },
    [token]
  )

  const clearAll = useCallback(() => {
    setNotifications([])
    if (token) readAllNotifications(token).catch(() => {})
  }, [token])

  const unreadCount = notifications.length

  return { notifications, unreadCount, markAsRead, clearAll }
}
