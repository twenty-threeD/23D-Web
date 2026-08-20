import { create } from 'zustand'

export interface ChatRoom {
  roomId: number
  postId?: number | null
  participantUsername: string
  participantName: string
  participantImageUrl?: string | null
  lastMessagePreview: string
  lastMessageAt: string
}

interface ChatRoomsStore {
  rooms: ChatRoom[]
  loaded: boolean
  unreadRoomIds: Record<number, boolean>
  lastMessageOverride: Record<number, string>
  activeRoomId: number | null
  setRooms: (rooms: ChatRoom[]) => void
  markRoomUnread: (roomId: number, message: string) => void
  markRoomRead: (roomId: number) => void
  setActiveRoomId: (roomId: number | null) => void
}

// 채팅 페이지(app/chat/[[...id]]/page.tsx)는 방을 전환할 때마다 리마운트되므로,
// 방 목록을 컴포넌트 로컬 상태가 아닌 스토어에 두어 재마운트 시에도 스켈레톤이 다시 뜨지 않게 한다.
export const useChatRoomsStore = create<ChatRoomsStore>((set, get) => ({
  rooms: [],
  loaded: false,
  unreadRoomIds: {},
  lastMessageOverride: {},
  activeRoomId: null,
  setRooms: (rooms) => set({ rooms, loaded: true }),
  markRoomUnread: (roomId, message) => {
    // 지금 보고 있는 방이면 굳이 안읽음으로 표시하지 않는다 (SSE 알림과 STOMP 실시간 수신이
    // 동시에 도착할 때 markRoomRead 이후에 이게 실행돼서 다시 안읽음으로 덮어쓰는 걸 방지).
    if (get().activeRoomId === roomId) return
    set((s) => ({
      unreadRoomIds: { ...s.unreadRoomIds, [roomId]: true },
      lastMessageOverride: { ...s.lastMessageOverride, [roomId]: message },
    }))
  },
  markRoomRead: (roomId) =>
    set((s) => {
      if (!s.unreadRoomIds[roomId]) return s
      const next = { ...s.unreadRoomIds }
      delete next[roomId]
      return { unreadRoomIds: next }
    }),
  setActiveRoomId: (roomId) => set({ activeRoomId: roomId }),
}))
