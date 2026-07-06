import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface LikeStore {
  likedPosts: number[]
  like: (postId: number) => void
  unlike: (postId: number) => void
  isLiked: (postId: number) => boolean
}

export const useLikeStore = create<LikeStore>()(
  persist(
    (set, get) => ({
      likedPosts: [],
      like: (postId) => set((s) => ({ likedPosts: [...s.likedPosts, postId] })),
      unlike: (postId) => set((s) => ({ likedPosts: s.likedPosts.filter((id) => id !== postId) })),
      isLiked: (postId) => get().likedPosts.includes(postId),
    }),
    { name: 'like-store' }
  )
)
