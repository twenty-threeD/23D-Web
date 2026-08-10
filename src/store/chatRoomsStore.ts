import { create } from 'zustand'

export interface ChatRoom {
  roomId: number
  participantUsername: string
  participantName: string
  lastMessagePreview: string
  lastMessageAt: string
}

interface ChatRoomsStore {
  rooms: ChatRoom[]
  loaded: boolean
  setRooms: (rooms: ChatRoom[]) => void
}

// 채팅 페이지(app/chat/[[...id]]/page.tsx)는 방을 전환할 때마다 리마운트되므로,
// 방 목록을 컴포넌트 로컬 상태가 아닌 스토어에 두어 재마운트 시에도 스켈레톤이 다시 뜨지 않게 한다.
export const useChatRoomsStore = create<ChatRoomsStore>((set) => ({
  rooms: [],
  loaded: false,
  setRooms: (rooms) => set({ rooms, loaded: true }),
}))
