'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { LoadingSkeleton } from '@/app/components/LoadingCard'

interface Playlist {
  id: string
  name: string
  images: { url: string }[]
  tracks: { total: number }
  external_urls: { spotify: string }
}

export function Playlists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const res = await fetch('/api/spotify/playlists')
        if (!res.ok) throw new Error('Failed to fetch playlists')
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        setPlaylists(data.items || [])
      } catch (err) {
        setError('Could not load your playlists')
      } finally {
        setLoading(false)
      }
    }

    fetchPlaylists()
  }, [])

  if (loading) return <LoadingSkeleton />

  if (error) {
    return (
      <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center">
        <p className="text-red-400">{error}</p>
      </div>
    )
  }

  if (!playlists.length) {
    return (
      <div className="rounded-3xl border border-slate-200/10 bg-white/[0.02] p-8 text-center">
        <p className="text-zinc-400">No playlists found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Your Playlists</h2>
      <div className="overflow-x-auto pb-4 -mb-4 scrollbar-hide">
        <div className="flex gap-4 min-w-min">
          {playlists.map((playlist, idx) => (
            <motion.a
              key={playlist.id}
              href={playlist.external_urls.spotify}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05, type: 'spring', damping: 20 }}
              className="group flex-shrink-0 w-48 rounded-2xl border border-slate-200/10 bg-white/[0.02] backdrop-blur overflow-hidden hover:bg-white/[0.05] transition-all cursor-pointer"
            >
              {playlist.images[0] && (
                <img
                  src={playlist.images[0].url}
                  alt={playlist.name}
                  className="w-full aspect-square object-cover group-hover:scale-105 transition-transform"
                />
              )}
              <div className="p-4">
                <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                  {playlist.name}
                </h3>
                <p className="text-xs text-zinc-400">
                  {playlist.tracks?.total ?? 0} tracks
                </p>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </div>
  )
}
