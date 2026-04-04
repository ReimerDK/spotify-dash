'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Header } from './components/Header'
import { ControlPanel } from './components/ControlPanel'
import { TopArtists } from './components/sections/TopArtists'
import { TopTracks } from './components/sections/TopTracks'
import { CurrentlyPlaying } from './components/sections/CurrentlyPlaying'
import { Playlists } from './components/sections/Playlists'
import { Search } from './components/sections/Search'
import { useDashboardStore } from '@/lib/store'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { sections } = useDashboardStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading' || !mounted) {
    return (
      <div className="min-h-[100dvh] bg-zinc-950 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full"
        />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-[100dvh] bg-zinc-950 flex flex-col">
      <Header onSettingsClick={() => setSettingsOpen(true)} />
      <ControlPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8 space-y-8">
          {/* Asymmetric Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-max">
            {/* Currently Playing - Full width top */}
            {sections.currentlyPlaying && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="md:col-span-3"
              >
                <CurrentlyPlaying />
              </motion.div>
            )}

            {/* Top Artists - Right column */}
            {sections.topArtists && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="md:col-span-1"
              >
                <TopArtists />
              </motion.div>
            )}

            {/* Top Tracks - Left (2 columns) */}
            {sections.topTracks && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="md:col-span-2"
              >
                <TopTracks />
              </motion.div>
            )}

            {/* Search - Left column */}
            {sections.search && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="md:col-span-1"
              >
                <Search />
              </motion.div>
            )}

            {/* Playlists - Right (2 columns) */}
            {sections.playlists && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="md:col-span-2"
              >
                <Playlists />
              </motion.div>
            )}
          </div>

          {/* Empty State Message */}
          {!Object.values(sections).some((v) => v) && (
            <div className="text-center py-12">
              <p className="text-zinc-400 mb-4">
                All sections are hidden. Open settings to show them.
              </p>
              <button
                onClick={() => setSettingsOpen(true)}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-semibold transition-colors"
              >
                Open Settings
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
