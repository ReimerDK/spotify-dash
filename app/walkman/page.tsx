'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Walkman } from '@/app/components/Walkman'

interface Track {
  id: string
  uri: string
  name: string
  duration_ms: number
  album: { images: { url: string }[] }
  artists: { name: string }[]
}

interface Artist {
  id: string
  name: string
  images: { url: string }[]
}

export default function WalkmanPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null)
  const [topTracks, setTopTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  const handleSearch = async (query: string) => {
    if (!query.trim()) return

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}&type=artist&limit=1`)
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      const artist = data.artists?.items?.[0]

      if (!artist) {
        setError('Artist not found')
        setSelectedArtist(null)
        setTopTracks([])
        return
      }

      setSelectedArtist(artist)
      setTopTracks([])
      setCurrentTrackIndex(0)
      setPlaying(false)

      // Fetch artist's top tracks
      const tracksRes = await fetch(`/api/spotify/artist-top-tracks?id=${artist.id}`)
      if (!tracksRes.ok) throw new Error('Failed to fetch tracks')
      const tracksData = await tracksRes.json()
      setTopTracks(tracksData.tracks?.slice(0, 12) || [])
      setError(null)
    } catch (err) {
      console.error('Search error:', err)
      setError('Search failed')
      setSelectedArtist(null)
      setTopTracks([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelectArtist = (artistName: string) => {
    handleSearch(artistName)
  }

  const handlePlayTrack = async (index: number) => {
    if (!topTracks[index]) return
    setCurrentTrackIndex(index)
    setError(null)

    try {
      const res = await fetch('/api/spotify/player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'play_uri', uris: [topTracks[index].uri] }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Playback failed')
        setPlaying(false)
        return
      }

      setPlaying(true)
    } catch (err) {
      console.error('Play error:', err)
      setError('Play failed')
      setPlaying(false)
    }
  }

  const handleTogglePlay = async () => {
    if (playing) {
      // Pause
      try {
        await fetch('/api/spotify/player', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'pause' }),
        })
        setPlaying(false)
      } catch (err) {
        console.error('Pause error:', err)
      }
    } else {
      // Resume or play current track
      await handlePlayTrack(currentTrackIndex)
    }
  }

  const handlePlayNext = async () => {
    if (topTracks.length === 0) return
    const nextIndex = (currentTrackIndex + 1) % topTracks.length
    await handlePlayTrack(nextIndex)
  }

  const handlePlayPrev = async () => {
    if (topTracks.length === 0) return
    const prevIndex = currentTrackIndex === 0 ? topTracks.length - 1 : currentTrackIndex - 1
    await handlePlayTrack(prevIndex)
  }

  if (status === 'loading') {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-b from-amber-900 via-amber-950 to-yellow-950 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-yellow-700/20 border-t-yellow-700 rounded-full"
        />
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-amber-900 via-amber-950 to-yellow-950 flex items-center justify-center p-4">
      {/* Background texture */}
      <div className="fixed inset-0 opacity-5 mix-blend-multiply pointer-events-none bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,.5)_10px,rgba(0,0,0,.5)_20px)]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 20 }}
        className="relative z-10"
      >
        <Walkman
          artistName={selectedArtist?.name}
          artistImage={selectedArtist?.images?.[0]?.url}
          isPlaying={playing}
          currentTrack={topTracks[currentTrackIndex]}
          currentTrackIndex={currentTrackIndex}
          tracks={topTracks}
          onSearch={handleSearch}
          onPlayTrack={handlePlayTrack}
          onTogglePlay={handleTogglePlay}
          onPlayNext={handlePlayNext}
          onPlayPrev={handlePlayPrev}
          loading={loading}
          error={error}
        />
      </motion.div>
    </div>
  )
}
