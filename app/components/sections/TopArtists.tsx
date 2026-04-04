'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LoadingSkeleton } from '@/app/components/LoadingCard'
import { Play, X } from '@phosphor-icons/react'

interface Artist {
  id: string
  uri: string
  name: string
  images: { url: string }[]
  genres: string[]
}

interface Track {
  id: string
  uri: string
  name: string
  duration_ms: number
  album: { images: { url: string }[] }
  artists: { name: string }[]
}

async function playContext(uri: string) {
  await fetch('/api/spotify/player', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'play_uri', context_uri: uri }),
  })
}

async function playTrack(uri: string) {
  await fetch('/api/spotify/player', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'play_uri', uris: [uri] }),
  })
}

function fmt(ms: number) {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function TopArtists() {
  const [artists, setArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Artist | null>(null)
  const [topTracks, setTopTracks] = useState<Track[]>([])
  const [tracksLoading, setTracksLoading] = useState(false)

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const res = await fetch('/api/spotify/top-artists')
        if (!res.ok) throw new Error('Failed to fetch artists')
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        setArtists(data.items || [])
      } catch {
        setError('Could not load your top artists')
      } finally {
        setLoading(false)
      }
    }
    fetchArtists()
  }, [])

  const handleSelect = async (artist: Artist) => {
    if (selected?.id === artist.id) {
      setSelected(null)
      setTopTracks([])
      return
    }
    setSelected(artist)
    setTopTracks([])
    setTracksLoading(true)
    try {
      const res = await fetch(`/api/spotify/artist-top-tracks?id=${artist.id}`)
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      setTopTracks(data.tracks?.slice(0, 10) || [])
    } catch {
      setTopTracks([])
    } finally {
      setTracksLoading(false)
    }
  }

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

      {/* Artist row — compact when selected, grid when not */}
      <motion.div layout className={`grid gap-3 ${selected ? 'grid-cols-6' : 'grid-cols-2 md:grid-cols-3'}`}>
        {artists.slice(0, 6).map((artist, idx) => (
          <motion.div
            key={artist.id}
            layout
            onClick={() => handleSelect(artist)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: selected ? 0 : idx * 0.05, type: 'spring', damping: 20 }}
            className={`group rounded-2xl border bg-white/[0.02] backdrop-blur cursor-pointer transition-all overflow-hidden ${
              selected?.id === artist.id
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : 'border-slate-200/10 hover:bg-white/[0.05]'
            } ${selected ? 'p-1.5' : 'p-4'}`}
          >
            {artist.images?.[0] && (
              <img
                src={artist.images[0].url}
                alt={artist.name}
                className={`w-full aspect-square rounded-lg object-cover transition-transform ${selected ? '' : 'mb-3 group-hover:scale-105'}`}
              />
            )}
            {!selected && (
              <>
                <h3 className="font-semibold text-sm line-clamp-1">{artist.name}</h3>
                {artist.genres?.[0] && (
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-1">{artist.genres[0]}</p>
                )}
              </>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Top Tracks panel */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="rounded-2xl border border-slate-200/10 bg-white/[0.02] backdrop-blur overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/10">
              <div className="flex items-center gap-2 min-w-0">
                {selected.images?.[0] && (
                  <img src={selected.images[0].url} alt={selected.name} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Top Hits</p>
                  <p className="text-sm font-semibold truncate">{selected.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => playContext(selected.uri)}
                  className="text-xs px-3 py-1 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold transition-colors"
                >
                  Play all
                </button>
                <button
                  onClick={() => { setSelected(null); setTopTracks([]) }}
                  className="text-zinc-500 hover:text-white transition-colors p-1"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Tracks */}
            <div className="divide-y divide-slate-200/10">
              {tracksLoading ? (
                <div className="flex items-center justify-center py-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full"
                  />
                </div>
              ) : (
                topTracks.map((track, idx) => (
                  <motion.div
                    key={track.id}
                    onClick={() => playTrack(track.uri)}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03, type: 'spring', damping: 25 }}
                    className="group flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.05] transition-colors cursor-pointer"
                  >
                    <span className="text-xs text-zinc-400 w-5 text-right flex-shrink-0 font-mono">{String(idx + 1).padStart(2, ' ')}</span>
                    {track.album?.images?.[0] && (
                      <img src={track.album.images[0].url} alt={track.name} className="w-8 h-8 rounded object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{track.name}</p>
                      <p className="text-xs text-zinc-500 truncate">{track.artists?.map(a => a.name).join(', ')}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-zinc-500 tabular-nums">{fmt(track.duration_ms)}</span>
                      <Play size={14} weight="fill" className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
