'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { LoadingSkeleton } from '@/app/components/LoadingCard'
import { Play } from '@phosphor-icons/react'

interface Track {
  id: string
  name: string
  artists: { name: string }[]
  album: { images: { url: string }[] }
  external_urls: { spotify: string }
}

export function TopTracks() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const res = await fetch('/api/spotify/top-tracks')
        if (!res.ok) throw new Error('Failed to fetch tracks')
        const data = await res.json()
        setTracks(data.items || [])
      } catch (err) {
        setError('Could not load your top tracks')
      } finally {
        setLoading(false)
      }
    }

    fetchTracks()
  }, [])

  if (loading) return <LoadingSkeleton />

  if (error) {
    return (
      <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center">
        <p className="text-red-400">{error}</p>
      </div>
    )
  }

  if (!tracks.length) {
    return (
      <div className="rounded-3xl border border-slate-200/10 bg-white/[0.02] p-8 text-center">
        <p className="text-zinc-400">No tracks found. Start listening on Spotify!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Top Tracks</h2>
      <div className="rounded-3xl border border-slate-200/10 bg-white/[0.02] backdrop-blur divide-y divide-slate-200/10">
        {tracks.slice(0, 8).map((track, idx) => (
          <motion.a
            key={track.id}
            href={track.external_urls.spotify}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.03, type: 'spring', damping: 25 }}
            className="group p-4 flex items-center gap-4 hover:bg-white/[0.05] transition-colors cursor-pointer"
          >
            {/* Rank */}
            <div className="text-sm font-bold text-emerald-500 w-6">{idx + 1}</div>

            {/* Album Art */}
            {track.album.images[0] && (
              <img
                src={track.album.images[0].url}
                alt={track.name}
                className="w-12 h-12 rounded object-cover group-hover:scale-110 transition-transform"
              />
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{track.name}</h3>
              <p className="text-xs text-zinc-400 truncate">
                {track.artists.map((a) => a.name).join(', ')}
              </p>
            </div>

            {/* Play Icon */}
            <Play
              size={20}
              weight="fill"
              className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </motion.a>
        ))}
      </div>
    </div>
  )
}
