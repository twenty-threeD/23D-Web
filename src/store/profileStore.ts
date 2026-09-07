import { create } from 'zustand'

interface ProfileStore {
  imageUrl: string | null
  loaded: boolean
  setImageUrl: (url: string | null) => void
  reset: () => void
}

export const useProfileStore = create<ProfileStore>((set) => ({
  imageUrl: null,
  loaded: false,
  setImageUrl: (url) => set({ imageUrl: url, loaded: true }),
  reset: () => set({ imageUrl: null, loaded: false }),
}))
