'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { LoadingSkeleton } from '@/app/components/LoadingCard'

interface Artist {
  id: string
  name: string
  images: { url: string }[]
  genres: string[]
}

export function TopArtists() {
  const [artists, setArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const res = await fetch('/api/spotify/top-artists')
        if (!res.ok) throw new Error('Failed to fetch artists')
        const data = await res.json()
        setArtists(data.items || [])
      } catch (err) {
        setError('Could not load your top artists')
      } finally {
        setLoading(false)
      }
    }

    fetchArtists()
  }, [])

  if (loading) return <LoadingSkeleton />

  if (error) {
    return (
      <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center">
        <p className="text-red-400">{error}</p>
      </div>
    )
  }

  if (!artists.length) {
    return (
      <div className="rounded-3xl border border-slate-200/10 bg-white/[0.02] p-8 text-center">
        <p className="text-zinc-400">No artists found. Start listening on Spotify!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Top Artists</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {artists.slice(0, 6).map((artist, idx) => (
          <motion.a
            key={artist.id}
            href={`https://open.spotify.com/artist/${artist.id}`}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, type: 'spring', damping: 20 }}
            className="group rounded-2xl border border-slate-200/10 bg-white/[0.02] backdrop-blur p-4 hover:bg-white/[0.05] transition-all cursor-pointer"
          >
            {artist.images[0] && (
              <img
                src={artist.images[0].url}
                alt={artist.name}
                className="w-full aspect-square rounded-lg mb-3 object-cover group-hover:scale-105 transition-transform"
              />
            )}
            <h3 className="font-semibold text-sm line-clamp-1">{artist.name}</h3>
            {artist.genres[0] && (
              <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
                {artist.genres[0]}
              </p>
            )}
          </motion.a>
        ))}
      </div>
    </div>
  )
}
