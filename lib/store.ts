'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface DashboardStore {
  sections: {
    topArtists: boolean
    topTracks: boolean
    currentlyPlaying: boolean
    playlists: boolean
    search: boolean
  }
  toggleSection: (key: keyof DashboardStore['sections']) => void
  resetSections: () => void
}

const defaultSections = {
  topArtists: true,
  topTracks: true,
  currentlyPlaying: true,
  playlists: true,
  search: true,
}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set) => ({
      sections: defaultSections,
      toggleSection: (key) =>
        set((state) => ({
          sections: {
            ...state.sections,
            [key]: !state.sections[key],
          },
        })),
      resetSections: () =>
        set({
          sections: defaultSections,
        }),
    }),
    {
      name: 'dashboard-storage',
    }
  )
)
