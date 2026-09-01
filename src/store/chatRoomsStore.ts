import { create } from 'zustand'

export interface ChatRoom {
  roomId: number
  postId?: number | null
  participantId?: number | null
  participantUsername: string
  participantName: string
  participantImageUrl?: string | null
  lastMessagePreview: string
  lastMessageAt: string
  // 나가기는 서버에서 소프트 삭제라 roomId 가 유지된다. 이 시각 이전 메시지는
  // 이 사용자에게 보이면 안 된다 (나간 적이 없으면 null). 로컬 캐시 정리 기준.
  clearBefore?: string | null
}

export interface SelectedService {
  planName: string
  price: string
}

interface ChatRoomsStore {
  rooms: ChatRoom[]
  loaded: boolean
  unreadRoomIds: Record<number, boolean>
  lastMessageOverride: Record<number, string>
  activeRoomId: number | null
  // 문의하기에서 고른 서비스. roomId 기준으로 기억해뒀다가
  // 채팅방 입장 시 인사말 발송, 계약서 3조(대금) 자동 채움에 재사용한다.
  // (백엔드에 채팅방-서비스 연결 필드가 없어 프론트에서만 들고 있음)
  selectedService: Record<number, SelectedService>
  // 새로 만들어진 방에서 인사말을 아직 안 보냈으면 true. 채팅 페이지가 STOMP 연결되는 즉시
  // 이 값을 보고 인사말을 보낸 뒤 지운다.
  pendingGreeting: Record<number, boolean>
  setRooms: (rooms: ChatRoom[]) => void
  markRoomUnread: (roomId: number, message: string) => void
  markRoomRead: (roomId: number) => void
  setActiveRoomId: (roomId: number | null) => void
  setSelectedService: (roomId: number, service: SelectedService, isNewRoom: boolean) => void
  clearPendingGreeting: (roomId: number) => void
}

// 채팅 페이지(app/chat/[[...id]]/page.tsx)는 방을 전환할 때마다 리마운트되므로,
// 방 목록을 컴포넌트 로컬 상태가 아닌 스토어에 두어 재마운트 시에도 스켈레톤이 다시 뜨지 않게 한다.
export const useChatRoomsStore = create<ChatRoomsStore>((set, get) => ({
  rooms: [],
  loaded: false,
  unreadRoomIds: {},
  lastMessageOverride: {},
  activeRoomId: null,
  selectedService: {},
  pendingGreeting: {},
  setRooms: (rooms) => set({ rooms, loaded: true }),
  setSelectedService: (roomId, service, isNewRoom) =>
    set((s) => ({
      selectedService: { ...s.selectedService, [roomId]: service },
      pendingGreeting: isNewRoom ? { ...s.pendingGreeting, [roomId]: true } : s.pendingGreeting,
    })),
  clearPendingGreeting: (roomId) =>
    set((s) => {
      if (!s.pendingGreeting[roomId]) return s
      const next = { ...s.pendingGreeting }
      delete next[roomId]
      return { pendingGreeting: next }
    }),
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
