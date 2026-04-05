'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, MagnifyingGlass } from '@phosphor-icons/react'
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
  const [searchQuery, setSearchQuery] = useState('')
  const [artists, setArtists] = useState<Artist[]>([])
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null)
  const [topTracks, setTopTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setLoading(true)
    try {
      const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(searchQuery)}&type=artist`)
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      setArtists(data.artists?.items || [])
    } catch (error) {
      console.error('Search error:', error)
      setArtists([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelectArtist = async (artist: Artist) => {
    setSelectedArtist(artist)
    setTopTracks([])
    setPlaying(false)
    setCurrentTrackIndex(0)

    try {
      const res = await fetch(`/api/spotify/artist-top-tracks?id=${artist.id}`)
      if (!res.ok) throw new Error('Failed to fetch tracks')
      const data = await res.json()
      setTopTracks(data.tracks?.slice(0, 12) || [])
    } catch (error) {
      console.error('Fetch error:', error)
      setTopTracks([])
    }
  }

  const handlePlayTrack = async (index: number) => {
    if (!topTracks[index]) return
    setCurrentTrackIndex(index)
    setPlaying(true)

    try {
      await fetch('/api/spotify/player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'play_uri', uris: [topTracks[index].uri] }),
      })
    } catch (error) {
      console.error('Play error:', error)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-[100dvh] bg-amber-950 flex items-center justify-center">
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
    <div className="min-h-[100dvh] bg-gradient-to-b from-amber-900 via-amber-950 to-yellow-950">
      {/* Background texture */}
      <div className="fixed inset-0 opacity-5 mix-blend-multiply pointer-events-none bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,.5)_10px,rgba(0,0,0,.5)_20px)]" />

      <main className="relative flex flex-col items-center justify-center min-h-[100dvh] px-4 py-8">
        {/* Walkman Device */}
        <Walkman
          artistName={selectedArtist?.name}
          artistImage={selectedArtist?.images?.[0]?.url}
          isPlaying={playing}
          currentTrack={topTracks[currentTrackIndex]}
          onPlayNext={() => {
            const nextIndex = (currentTrackIndex + 1) % topTracks.length
            handlePlayTrack(nextIndex)
          }}
          onPlayPrev={() => {
            const prevIndex = currentTrackIndex === 0 ? topTracks.length - 1 : currentTrackIndex - 1
            handlePlayTrack(prevIndex)
          }}
        />

        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 w-full max-w-md"
        >
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search for an artist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-yellow-100/10 border border-yellow-600/30 text-yellow-50 placeholder-yellow-600/60 focus:outline-none focus:border-yellow-500 transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-yellow-600 hover:text-yellow-400 transition-colors disabled:opacity-50"
            >
              <MagnifyingGlass size={20} />
            </button>
          </form>
        </motion.div>

        {/* Artists Grid */}
        {artists.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl"
          >
            {artists.slice(0, 8).map((artist) => (
              <motion.button
                key={artist.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSelectArtist(artist)}
                className={`p-4 rounded-lg transition-all backdrop-blur ${
                  selectedArtist?.id === artist.id
                    ? 'bg-yellow-500/40 border-2 border-yellow-400'
                    : 'bg-yellow-100/5 border border-yellow-600/30 hover:bg-yellow-100/10'
                }`}
              >
                {artist.images?.[0] && (
                  <img
                    src={artist.images[0].url}
                    alt={artist.name}
                    className="w-full aspect-square rounded-md object-cover mb-3"
                  />
                )}
                <p className="text-sm font-semibold text-yellow-100 line-clamp-2">{artist.name}</p>
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Tracks List */}
        {selectedArtist && topTracks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 w-full max-w-2xl"
          >
            <div className="rounded-lg bg-yellow-100/5 border border-yellow-600/30 backdrop-blur overflow-hidden">
              <div className="px-6 py-4 border-b border-yellow-600/20">
                <p className="text-sm text-yellow-600 font-mono">Top Hits</p>
                <p className="text-xl font-bold text-yellow-100">{selectedArtist.name}</p>
              </div>

              <div className="divide-y divide-yellow-600/20 max-h-64 overflow-y-auto">
                {topTracks.map((track, idx) => (
                  <motion.button
                    key={track.id}
                    whileHover={{ backgroundColor: 'rgba(250, 204, 21, 0.1)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePlayTrack(idx)}
                    className="w-full flex items-center gap-4 px-6 py-3 text-left transition-colors hover:bg-yellow-100/5"
                  >
                    <span className="text-xs text-yellow-600 font-mono w-5 text-right flex-shrink-0">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    {track.album?.images?.[0] && (
                      <img
                        src={track.album.images[0].url}
                        alt={track.name}
                        className="w-10 h-10 rounded object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-yellow-100 truncate">{track.name}</p>
                      <p className="text-xs text-yellow-600 truncate">{track.artists?.map(a => a.name).join(', ')}</p>
                    </div>
                    <motion.div
                      animate={currentTrackIndex === idx && playing ? { rotate: 360 } : {}}
                      transition={{
                        duration: 2,
                        repeat: currentTrackIndex === idx && playing ? Infinity : 0,
                        ease: 'linear',
                      }}
                      className="text-yellow-500 flex-shrink-0"
                    >
                      {currentTrackIndex === idx && playing ? (
                        <Pause size={18} weight="fill" />
                      ) : (
                        <Play size={18} weight="fill" />
                      )}
                    </motion.div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  )
}
