'use client'

import { motion } from 'framer-motion'
import { Play, Pause, SkipBack, SkipForward, MagnifyingGlass, CaretDown } from '@phosphor-icons/react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'

interface SpotifySDKPlayer {
  connect(): Promise<boolean>
  disconnect(): void
  addListener(event: string, cb: (data: any) => void): void
  pause(): Promise<void>
  resume(): Promise<void>
}


interface Track {
  id: string
  uri: string
  name: string
  artists: { name: string }[]
  duration_ms: number
  album: { images: { url: string }[] }
}

export function Walkman() {
  const { data: session } = useSession()
  const playerRef = useRef<SpotifySDKPlayer | null>(null)
  const deviceIdRef = useRef<string | null>(null)

  const [tracks, setTracks] = useState<Track[]>([])
  const [artistName, setArtistName] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [showTracks, setShowTracks] = useState(false)
  const [ready, setReady] = useState(false)

  // Initialize Web Playback SDK — identical pattern to MiniPlayer
  useEffect(() => {
    if (!session?.accessToken) return
    const token = session.accessToken as string

    const initPlayer = () => {
      if (playerRef.current) return

      const player = new window.Spotify.Player({
        name: 'Spotify Walkman',
        getOAuthToken: (cb) => cb(token),
        volume: 0.8,
      })

      player.addListener('ready', async ({ device_id }: { device_id: string }) => {
        deviceIdRef.current = device_id
        // Activate this device
        await fetch('https://api.spotify.com/v1/me/player', {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ device_ids: [device_id] }),
        })
        setReady(true)
      })

      player.addListener('player_state_changed', (s: any) => {
        if (!s) return
        setIsPlaying(!s.paused)
      })

      player.connect()
      playerRef.current = player
    }

    if (window.Spotify) {
      initPlayer()
    } else {
      const prev = window.onSpotifyWebPlaybackSDKReady
      window.onSpotifyWebPlaybackSDKReady = () => {
        prev?.()
        initPlayer()
      }
    }

    if (!document.getElementById('spotify-sdk')) {
      const script = document.createElement('script')
      script.id = 'spotify-sdk'
      script.src = 'https://sdk.scdn.co/spotify-player.js'
      script.async = true
      document.body.appendChild(script)
    }

    return () => {
      playerRef.current?.disconnect()
      playerRef.current = null
    }
  }, [session?.accessToken])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchInput.trim()) return
    setLoading(true)
    setTracks([])
    setIsPlaying(false)

    try {
      const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(searchInput)}&type=artist&limit=1`)
      const data = await res.json()
      const artist = data.artists?.items?.[0]
      if (!artist) return

      setArtistName(artist.name)

      const tracksRes = await fetch(`/api/spotify/artist-top-tracks?id=${artist.id}`)
      const tracksData = await tracksRes.json()
      setTracks(tracksData.tracks?.slice(0, 10) || [])
      setCurrentIndex(0)
    } finally {
      setLoading(false)
    }
  }

  // Play a specific track by URI using the SDK device_id — same approach as MiniPlayer
  const play = async (index: number) => {
    if (!tracks[index] || !session?.accessToken) return
    setCurrentIndex(index)

    const token = session.accessToken as string
    const deviceId = deviceIdRef.current

    await fetch(`https://api.spotify.com/v1/me/player/play${deviceId ? `?device_id=${deviceId}` : ''}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uris: [tracks[index].uri] }),
    })
    setIsPlaying(true)
  }

  const togglePlay = () => {
    if (isPlaying) {
      playerRef.current?.pause()
      setIsPlaying(false)
    } else {
      play(currentIndex)
    }
  }

  const next = () => play((currentIndex + 1) % tracks.length)
  const prev = () => play(currentIndex === 0 ? tracks.length - 1 : currentIndex - 1)

  const currentTrack = tracks[currentIndex]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 20 }}
      className="w-full max-w-sm mx-auto"
    >
      <div className="relative bg-gradient-to-b from-yellow-100 via-yellow-50 to-yellow-100 rounded-2xl shadow-2xl p-6 border-8 border-yellow-300/60 flex flex-col gap-4">
        {/* Top Trim */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-b from-gray-400 to-gray-300 rounded-t-xl border-b border-gray-500/30" />

        {/* LCD Display */}
        <div className="mt-2 p-3 bg-gray-900 rounded-lg border-2 border-gray-800 shadow-inner min-h-[56px] flex flex-col justify-center">
          <p className="text-[10px] text-yellow-600 font-mono uppercase tracking-wider truncate">
            {loading ? 'Searching...' : !ready ? 'Loading player...' : (artistName || 'Type artist below')}
          </p>
          <p className="text-xs text-yellow-100 font-semibold line-clamp-1 mt-0.5">
            {currentTrack?.name || (tracks.length > 0 ? 'Press play' : '—')}
          </p>
          {currentTrack && (
            <p className="text-[9px] text-yellow-700 truncate">
              {currentTrack.artists.map(a => a.name).join(', ')}
            </p>
          )}
        </div>

        {/* Cassette Window */}
        <div className="bg-gray-900 rounded-xl p-4 border-4 border-gray-800">
          <div className="flex items-center justify-center gap-3">
            <motion.div
              animate={isPlaying ? { rotate: 360 } : {}}
              transition={{ duration: 2, repeat: isPlaying ? Infinity : 0, ease: 'linear' }}
              className="w-12 h-12 rounded-full border-4 border-gray-600 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center flex-shrink-0"
            >
              <div className="w-6 h-6 rounded-full border-2 border-gray-500 bg-gray-900" />
            </motion.div>

            <div className="flex-1 h-3 bg-gray-700 rounded-sm relative overflow-hidden">
              {isPlaying && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-40"
                  animate={{ x: ['100%', '-100%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                />
              )}
            </div>

            <motion.div
              animate={isPlaying ? { rotate: -360 } : {}}
              transition={{ duration: 2, repeat: isPlaying ? Infinity : 0, ease: 'linear' }}
              className="w-12 h-12 rounded-full border-4 border-gray-600 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center flex-shrink-0"
            >
              <div className="w-6 h-6 rounded-full border-2 border-gray-500 bg-gray-900" />
            </motion.div>
          </div>
        </div>

        {/* Track List */}
        {tracks.length > 0 && (
          <div className="bg-gray-900 rounded-lg border-2 border-gray-800 overflow-hidden">
            <button
              onClick={() => setShowTracks(!showTracks)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs text-yellow-300 hover:bg-gray-800 transition-colors"
            >
              <span className="font-mono">{tracks.length} tracks</span>
              <motion.div animate={{ rotate: showTracks ? 180 : 0 }}>
                <CaretDown size={12} />
              </motion.div>
            </button>
            {showTracks && (
              <div className="max-h-32 overflow-y-auto border-t border-gray-800">
                {tracks.map((track, idx) => (
                  <button
                    key={track.id}
                    onClick={() => { play(idx); setShowTracks(false) }}
                    className={`w-full text-left px-3 py-1.5 text-[10px] border-t border-gray-800 transition-colors ${
                      currentIndex === idx && isPlaying
                        ? 'bg-yellow-500/30 text-yellow-100'
                        : 'text-yellow-400 hover:bg-gray-800'
                    }`}
                  >
                    <span className="font-mono text-yellow-600">{idx + 1}.</span> {track.name.slice(0, 22)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search */}
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            placeholder="Search artist..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded bg-yellow-50 border border-yellow-300 text-yellow-900 placeholder-yellow-600/60 focus:outline-none focus:border-yellow-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-yellow-600 hover:text-yellow-700 disabled:opacity-50"
          >
            <MagnifyingGlass size={14} weight="bold" />
          </button>
        </form>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={prev}
            disabled={tracks.length === 0}
            className="p-2 rounded-full bg-yellow-400 hover:bg-yellow-300 text-yellow-950 transition-colors disabled:opacity-40"
          >
            <SkipBack size={14} weight="fill" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={togglePlay}
            disabled={tracks.length === 0 || !ready}
            className={`p-3 rounded-full transition-colors disabled:opacity-40 ${
              isPlaying ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isPlaying ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" />}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={next}
            disabled={tracks.length === 0}
            className="p-2 rounded-full bg-yellow-400 hover:bg-yellow-300 text-yellow-950 transition-colors disabled:opacity-40"
          >
            <SkipForward size={14} weight="fill" />
          </motion.button>
        </div>

        {/* VU Meter */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-yellow-900 font-mono font-bold">VOL</span>
          <div className="flex-1 h-1.5 bg-yellow-300 rounded-full overflow-hidden">
            <motion.div
              animate={isPlaying ? { width: ['15%', '75%', '15%'] } : { width: '30%' }}
              transition={{ duration: 2, repeat: isPlaying ? Infinity : 0, ease: 'easeInOut' }}
              className="h-full bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full"
            />
          </div>
        </div>

        {/* Brand */}
        <div className="text-center text-[9px] text-yellow-900 font-bold tracking-widest pb-1">
          SPOTIFY WALKMAN
        </div>

        {/* Bottom Trim */}
        <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-b from-gray-300 to-gray-400 rounded-b-xl border-t border-gray-500/30" />
      </div>
    </motion.div>
  )
}
