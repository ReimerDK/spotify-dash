'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { SkipBack, SkipForward, MagnifyingGlass, CaretDown } from '@phosphor-icons/react'
import { useState, useEffect, useRef } from 'react'
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
  const [showSearch, setShowSearch] = useState(false)
  const [showTracks, setShowTracks] = useState(false)
  const [ready, setReady] = useState(false)

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
        await fetch('https://api.spotify.com/v1/me/player', {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
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
      window.onSpotifyWebPlaybackSDKReady = () => { prev?.(); initPlayer() }
    }

    if (!document.getElementById('spotify-sdk')) {
      const script = document.createElement('script')
      script.id = 'spotify-sdk'
      script.src = 'https://sdk.scdn.co/spotify-player.js'
      script.async = true
      document.body.appendChild(script)
    }

    return () => { playerRef.current?.disconnect(); playerRef.current = null }
  }, [session?.accessToken])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchInput.trim()) return
    setLoading(true)
    setTracks([])
    setIsPlaying(false)
    setShowSearch(false)
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

  const play = async (index: number) => {
    if (!tracks[index] || !session?.accessToken) return
    setCurrentIndex(index)
    const token = session.accessToken as string
    const deviceId = deviceIdRef.current
    await fetch(`https://api.spotify.com/v1/me/player/play${deviceId ? `?device_id=${deviceId}` : ''}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ uris: [tracks[index].uri] }),
    })
    setIsPlaying(true)
  }

  const togglePlay = () => {
    if (!tracks.length || !ready) return
    if (isPlaying) {
      playerRef.current?.pause()
      setIsPlaying(false)
    } else {
      play(currentIndex)
    }
  }

  const currentTrack = tracks[currentIndex]

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-xs mx-auto select-none">

      {/* Track info */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-xs tracking-[0.2em] uppercase text-zinc-500 mb-1">
          {loading ? 'Searching…' : !ready ? 'Loading…' : (artistName || 'Search for an artist')}
        </p>
        <AnimatePresence mode="wait">
          <motion.p
            key={currentTrack?.id || 'empty'}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-lg font-semibold text-white tracking-tight"
          >
            {currentTrack?.name || '—'}
          </motion.p>
        </AnimatePresence>
        {currentTrack && (
          <p className="text-xs text-zinc-500 mt-0.5">
            {currentTrack.artists.map(a => a.name).join(', ')}
          </p>
        )}
      </motion.div>

      {/* Cassette — click to play/pause */}
      <motion.div
        onClick={togglePlay}
        className={`relative cursor-pointer ${tracks.length && ready ? '' : 'pointer-events-none opacity-60'}`}
        whileTap={{ scale: 0.97 }}
      >
        {/* Cassette body */}
        <div className="relative w-72 h-44 bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl flex flex-col items-center justify-center overflow-hidden">

          {/* Top notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-3 bg-zinc-950 rounded-b-lg" />

          {/* Label area */}
          <div className="absolute inset-x-6 top-5 bottom-12 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-700/10 border border-amber-700/30 flex items-center justify-center overflow-hidden">
            <div className="text-center px-3">
              <p className="text-[9px] tracking-widest uppercase text-amber-500/80 font-bold mb-0.5">
                {artistName || 'SPOTIFY'}
              </p>
              <p className="text-[8px] text-amber-400/50 line-clamp-1">
                {currentTrack?.name || 'WALKMAN'}
              </p>
            </div>
          </div>

          {/* Reels row */}
          <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-8">
            {/* Left reel */}
            <motion.div
              animate={isPlaying ? { rotate: 360 } : {}}
              transition={{ duration: 3, repeat: isPlaying ? Infinity : 0, ease: 'linear' }}
              className="w-12 h-12 rounded-full border-2 border-zinc-600 bg-zinc-950 flex items-center justify-center"
            >
              {/* Spokes */}
              {[0, 60, 120, 180, 240, 300].map(deg => (
                <div
                  key={deg}
                  className="absolute w-0.5 h-4 bg-zinc-600 rounded-full origin-bottom"
                  style={{ transform: `rotate(${deg}deg) translateX(-50%)`, bottom: '50%', left: '50%' }}
                />
              ))}
              <div className="w-4 h-4 rounded-full bg-zinc-700 border border-zinc-500 z-10" />
            </motion.div>

            {/* Tape window center */}
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-16 h-2 bg-zinc-800 rounded-sm relative overflow-hidden border border-zinc-700">
                {isPlaying && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent"
                    animate={{ x: ['100%', '-100%'] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                  />
                )}
              </div>
            </div>

            {/* Right reel */}
            <motion.div
              animate={isPlaying ? { rotate: -360 } : {}}
              transition={{ duration: 3, repeat: isPlaying ? Infinity : 0, ease: 'linear' }}
              className="w-12 h-12 rounded-full border-2 border-zinc-600 bg-zinc-950 flex items-center justify-center"
            >
              {[0, 60, 120, 180, 240, 300].map(deg => (
                <div
                  key={deg}
                  className="absolute w-0.5 h-4 bg-zinc-600 rounded-full origin-bottom"
                  style={{ transform: `rotate(${deg}deg) translateX(-50%)`, bottom: '50%', left: '50%' }}
                />
              ))}
              <div className="w-4 h-4 rounded-full bg-zinc-700 border border-zinc-500 z-10" />
            </motion.div>
          </div>

          {/* Playing pulse glow */}
          {isPlaying && (
            <motion.div
              className="absolute inset-0 rounded-2xl"
              animate={{ boxShadow: ['0 0 0px rgba(251,191,36,0)', '0 0 30px rgba(251,191,36,0.15)', '0 0 0px rgba(251,191,36,0)'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </div>
      </motion.div>

      {/* Skip controls */}
      <div className="flex items-center gap-10">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => play(currentIndex === 0 ? tracks.length - 1 : currentIndex - 1)}
          disabled={tracks.length === 0}
          className="text-zinc-500 hover:text-white transition-colors disabled:opacity-30"
        >
          <SkipBack size={22} weight="fill" />
        </motion.button>

        {/* Tap cassette hint */}
        <p className="text-[10px] tracking-widest uppercase text-zinc-700">
          {isPlaying ? 'tap to pause' : tracks.length ? 'tap to play' : ''}
        </p>

        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => play((currentIndex + 1) % tracks.length)}
          disabled={tracks.length === 0}
          className="text-zinc-500 hover:text-white transition-colors disabled:opacity-30"
        >
          <SkipForward size={22} weight="fill" />
        </motion.button>
      </div>

      {/* Track list */}
      {tracks.length > 0 && (
        <div className="w-full">
          <button
            onClick={() => setShowTracks(!showTracks)}
            className="w-full flex items-center justify-between text-xs text-zinc-600 hover:text-zinc-400 transition-colors py-1"
          >
            <span className="tracking-widest uppercase">Tracks</span>
            <motion.div animate={{ rotate: showTracks ? 180 : 0 }}>
              <CaretDown size={12} />
            </motion.div>
          </button>
          <AnimatePresence>
            {showTracks && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-2 space-y-px">
                  {tracks.map((track, idx) => (
                    <button
                      key={track.id}
                      onClick={() => { play(idx); setShowTracks(false) }}
                      className={`w-full text-left px-3 py-2 rounded text-xs transition-colors flex items-center gap-3 ${
                        currentIndex === idx
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50'
                      }`}
                    >
                      <span className="font-mono text-zinc-700 w-4 flex-shrink-0">{idx + 1}</span>
                      <span className="truncate">{track.name}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Search */}
      <div className="w-full">
        <AnimatePresence>
          {showSearch ? (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              onSubmit={handleSearch}
              className="relative"
            >
              <input
                autoFocus
                type="text"
                placeholder="Artist name…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onBlur={() => { if (!searchInput) setShowSearch(false) }}
                className="w-full bg-transparent border-b border-zinc-700 text-sm text-white placeholder-zinc-700 py-2 focus:outline-none focus:border-amber-500 transition-colors"
              />
              <button
                type="submit"
                className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-amber-400 transition-colors"
              >
                <MagnifyingGlass size={16} weight="bold" />
              </button>
            </motion.form>
          ) : (
            <motion.button
              key="icon"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSearch(true)}
              className="flex items-center gap-2 text-zinc-700 hover:text-zinc-400 transition-colors text-xs tracking-widest uppercase mx-auto"
            >
              <MagnifyingGlass size={14} />
              <span>Search artist</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

    </div>
  )
}
