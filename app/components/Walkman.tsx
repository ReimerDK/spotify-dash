'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { SkipBack, SkipForward, MagnifyingGlass, List, SpeakerLow, SpeakerHigh } from '@phosphor-icons/react'
import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'

interface SpotifySDKPlayer {
  connect(): Promise<boolean>
  disconnect(): void
  addListener(event: string, cb: (data: any) => void): void
  pause(): Promise<void>
  resume(): Promise<void>
  setVolume(v: number): Promise<void>
}

interface Track {
  id: string; uri: string; name: string
  artists: { name: string }[]
  duration_ms: number
  album: { images: { url: string }[] }
}

function fmt(ms: number) {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function Reel({ spinning, direction = 1 }: { spinning: boolean; direction?: 1 | -1 }) {
  return (
    <motion.div
      className="w-full h-full"
      animate={spinning ? { rotate: 360 * direction } : {}}
      transition={{ duration: 3, repeat: spinning ? Infinity : 0, ease: 'linear' }}
    >
      <svg viewBox="0 0 120 120" className="w-full h-full">
        <circle cx="60" cy="60" r="58" fill="#161616" stroke="#333" strokeWidth="1.5" />
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i / 24) * Math.PI * 2
          return <line key={i} x1={60 + 52 * Math.cos(a)} y1={60 + 52 * Math.sin(a)} x2={60 + 57 * Math.cos(a)} y2={60 + 57 * Math.sin(a)} stroke="#252525" strokeWidth="1" />
        })}
        <circle cx="60" cy="60" r="40" fill="#0f0f0f" stroke="#2a2a2a" strokeWidth="1" />
        {[0, 60, 120, 180, 240, 300].map(deg => {
          const r = (deg - 90) * Math.PI / 180
          return <line key={deg} x1={60 + 13 * Math.cos(r)} y1={60 + 13 * Math.sin(r)} x2={60 + 36 * Math.cos(r)} y2={60 + 36 * Math.sin(r)} stroke="#383838" strokeWidth="3" strokeLinecap="round" />
        })}
        <circle cx="60" cy="60" r="13" fill="#1a1a1a" stroke="#3a3a3a" strokeWidth="1.5" />
        <circle cx="60" cy="60" r="5" fill="#2a2a2a" stroke="#444" strokeWidth="1" />
        {[0, 120, 240].map(deg => {
          const r = (deg - 90) * Math.PI / 180
          return <circle key={deg} cx={60 + 8 * Math.cos(r)} cy={60 + 8 * Math.sin(r)} r="2.5" fill="#0a0a0a" />
        })}
      </svg>
    </motion.div>
  )
}

export function Walkman() {
  const { data: session } = useSession()
  const playerRef = useRef<SpotifySDKPlayer | null>(null)
  const deviceIdRef = useRef<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const [tracks, setTracks] = useState<Track[]>([])
  const [artistName, setArtistName] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showTracks, setShowTracks] = useState(false)
  const [ready, setReady] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const [position, setPosition] = useState(0)
  const positionRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!session?.accessToken) return
    const token = session.accessToken as string
    const initPlayer = () => {
      if (playerRef.current) return
      const player = new window.Spotify.Player({
        name: 'Spotify Walkman', getOAuthToken: (cb) => cb(token), volume: 0.8,
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
        if (!s.paused) {
          positionRef.current = s.position; setPosition(s.position)
          if (timerRef.current) clearInterval(timerRef.current)
          timerRef.current = setInterval(() => { positionRef.current += 250; setPosition(positionRef.current) }, 250)
        } else {
          if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
          setPosition(s.position)
        }
      })
      player.connect(); playerRef.current = player
    }
    if (window.Spotify) { initPlayer() } else {
      const prev = window.onSpotifyWebPlaybackSDKReady
      window.onSpotifyWebPlaybackSDKReady = () => { prev?.(); initPlayer() }
    }
    if (!document.getElementById('spotify-sdk')) {
      const s = document.createElement('script'); s.id = 'spotify-sdk'
      s.src = 'https://sdk.scdn.co/spotify-player.js'; s.async = true; document.body.appendChild(s)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      playerRef.current?.disconnect(); playerRef.current = null
    }
  }, [session?.accessToken])

  // Focus input when search opens
  useEffect(() => {
    if (showSearch) {
      setTimeout(() => searchInputRef.current?.focus(), 50)
    }
  }, [showSearch])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchInput.trim()
    if (!q) return
    setLoading(true); setTracks([]); setIsPlaying(false); setPosition(0)
    try {
      const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(q)}&type=artist&limit=1`)
      const data = await res.json()
      const artist = data.artists?.items?.[0]
      if (!artist) { setLoading(false); return }
      setArtistName(artist.name)
      const tr = await fetch(`/api/spotify/artist-top-tracks?id=${artist.id}`)
      const td = await tr.json()
      setTracks(td.tracks?.slice(0, 10) || [])
      setCurrentIndex(0)
      setShowSearch(false)
      setSearchInput('')
    } finally { setLoading(false) }
  }

  const play = async (index: number) => {
    if (!tracks[index] || !session?.accessToken) return
    setCurrentIndex(index); setPosition(0)
    const token = session.accessToken as string; const deviceId = deviceIdRef.current
    await fetch(`https://api.spotify.com/v1/me/player/play${deviceId ? `?device_id=${deviceId}` : ''}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ uris: [tracks[index].uri] }),
    })
    setIsPlaying(true)
  }

  const togglePlay = () => {
    if (!tracks.length || !ready) return
    if (isPlaying) { playerRef.current?.pause() } else { play(currentIndex) }
  }

  const currentTrack = tracks[currentIndex]
  const duration = currentTrack?.duration_ms || 1
  const progress = Math.min((position / duration) * 100, 100)

  return (
    <div className="min-h-[100dvh] w-full flex flex-col overflow-hidden select-none" style={{ background: '#0a0a0a' }}>

      {/* Chrome top */}
      <div className="h-2 flex-shrink-0" style={{ background: 'linear-gradient(180deg, #404040 0%, #1a1a1a 100%)' }} />

      {/* 80s stripe */}
      <div className="h-3 flex-shrink-0 overflow-hidden">
        <div className="flex h-full -skew-x-6 scale-x-110 -ml-2">
          {['#b060d0','#60c8f0','#b060d0','#60c8f0','#b060d0','#60c8f0','#b060d0','#60c8f0','#b060d0'].map((c, i) => (
            <div key={i} className="flex-1 h-full" style={{ background: c }} />
          ))}
        </div>
      </div>

      {/* ── LABEL (dark) — all UI inside ── */}
      <div className="flex-1 flex flex-col mx-4 mt-3 rounded-2xl overflow-hidden" style={{ background: '#141414', minHeight: 0 }}>
        <div className="flex-1 flex flex-col px-5 pt-5 pb-4" style={{ minHeight: 0 }}>

          {/* Branding */}
          <div className="flex items-baseline justify-between mb-5 flex-shrink-0">
            <h1 className="font-black text-2xl tracking-[0.14em] text-white" style={{ fontFamily: 'var(--font-geist-sans)' }}>
              WALK<span style={{ color: '#7c3aed' }}>·</span>MAN
            </h1>
            <span className="text-[9px] tracking-[0.22em] uppercase font-semibold" style={{ color: '#3a3a3a' }}>
              Stereo
            </span>
          </div>

          {/* Track info */}
          <div className="flex-shrink-0 mb-4">
            <AnimatePresence mode="wait">
              <motion.p
                key={currentTrack?.id || 'idle'}
                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                className="font-bold text-xl leading-tight truncate text-white"
                style={{ letterSpacing: '-0.01em' }}>
                {currentTrack?.name || (loading ? 'Searching…' : !ready ? 'Loading…' : '—')}
              </motion.p>
            </AnimatePresence>
            <p className="text-sm mt-1 truncate" style={{ color: '#4a4a4a' }}>
              {currentTrack?.artists.map(a => a.name).join(', ') || artistName || 'Search to begin'}
            </p>
          </div>

          {/* Progress */}
          <div className="flex-shrink-0 mb-5">
            <div className="h-px w-full rounded-full overflow-hidden" style={{ background: '#252525' }}>
              <motion.div className="h-full rounded-full"
                style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #7c3aed, #0ea5e9)' }}
                transition={{ duration: 0.25, ease: 'linear' }} />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] font-mono tabular-nums" style={{ color: '#333' }}>{fmt(position)}</span>
              <span className="text-[10px] font-mono tabular-nums" style={{ color: '#333' }}>{currentTrack ? fmt(duration) : '0:00'}</span>
            </div>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-3 flex-shrink-0 mb-5">
            <SpeakerLow size={12} weight="light" style={{ color: '#333', flexShrink: 0 }} />
            <div className="relative flex-1 h-px" style={{ background: '#252525' }}>
              <input type="range" min={0} max={1} step={0.02} value={volume}
                onChange={e => { const v = parseFloat(e.target.value); setVolume(v); playerRef.current?.setVolume(v) }}
                className="absolute w-full opacity-0 cursor-pointer"
                style={{ top: -8, height: 20 }} />
              <div className="h-full rounded-full" style={{ width: `${volume * 100}%`, background: '#7c3aed' }} />
            </div>
            <SpeakerHigh size={12} weight="light" style={{ color: '#333', flexShrink: 0 }} />
          </div>

          {/* Skip + icons row */}
          <div className="flex items-center justify-between flex-shrink-0 mt-auto">
            <div className="flex items-center gap-5">
              <motion.button whileTap={{ scale: 0.8 }}
                onClick={() => play(currentIndex === 0 ? tracks.length - 1 : currentIndex - 1)}
                disabled={!tracks.length} className="disabled:opacity-20" style={{ color: '#444' }}>
                <SkipBack size={20} weight="light" />
              </motion.button>
              <motion.button whileTap={{ scale: 0.8 }}
                onClick={() => play((currentIndex + 1) % tracks.length)}
                disabled={!tracks.length} className="disabled:opacity-20" style={{ color: '#444' }}>
                <SkipForward size={20} weight="light" />
              </motion.button>
            </div>
            <div className="flex items-center gap-4">
              <motion.button whileTap={{ scale: 0.8 }}
                onClick={() => { setShowSearch(s => !s); setShowTracks(false) }}
                style={{ color: showSearch ? '#7c3aed' : '#444' }}>
                <MagnifyingGlass size={18} weight="light" />
              </motion.button>
              <motion.button whileTap={{ scale: 0.8 }}
                onClick={() => { setShowTracks(s => !s); setShowSearch(false) }}
                disabled={!tracks.length} className="disabled:opacity-20"
                style={{ color: showTracks ? '#7c3aed' : '#444' }}>
                <List size={18} weight="light" />
              </motion.button>
            </div>
          </div>

          {/* Search — always rendered, just hidden */}
          <div
            className="overflow-hidden flex-shrink-0 transition-all duration-300"
            style={{ maxHeight: showSearch ? 48 : 0, marginTop: showSearch ? 16 : 0 }}
          >
            <form onSubmit={handleSearch}>
              <div className="relative" style={{ borderBottom: '1px solid #2a2a2a' }}>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Artist name…"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  className="w-full bg-transparent py-1.5 text-sm focus:outline-none"
                  style={{ color: '#ccc', caretColor: '#7c3aed', fontFamily: 'var(--font-geist-sans)' }}
                />
                <button type="submit" className="absolute right-0 top-1/2 -translate-y-1/2 p-1" style={{ color: '#7c3aed' }}>
                  <MagnifyingGlass size={14} weight="light" />
                </button>
              </div>
            </form>
          </div>

          {/* Track list */}
          <AnimatePresence>
            {showTracks && tracks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                className="overflow-hidden flex-shrink-0 mt-3"
              >
                <div className="overflow-y-auto" style={{ maxHeight: 130 }}>
                  {tracks.map((track, idx) => (
                    <button key={track.id}
                      onClick={() => { play(idx); setShowTracks(false) }}
                      className="w-full text-left py-1.5 flex items-center gap-2 border-b"
                      style={{ borderColor: '#1e1e1e', color: currentIndex === idx ? '#7c3aed' : '#444' }}>
                      <span className="font-mono text-[10px] w-4 text-right flex-shrink-0" style={{ color: '#2a2a2a' }}>{idx + 1}</span>
                      <span className="flex-1 truncate text-xs">{track.name}</span>
                      <span className="text-[10px] font-mono tabular-nums flex-shrink-0" style={{ color: '#2a2a2a' }}>{fmt(track.duration_ms)}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── REEL AREA ── */}
      <div className="flex-shrink-0 flex items-center justify-center relative py-2" style={{ height: '34vh', minHeight: 140 }}>
        {/* Left reel */}
        <motion.div className="cursor-pointer" style={{ width: '37vw', maxWidth: 160, height: '37vw', maxHeight: 160 }}
          onClick={togglePlay} whileTap={{ scale: 0.93 }}>
          <Reel spinning={isPlaying} direction={1} />
        </motion.div>

        {/* Tape bridge */}
        <div className="px-3 flex-shrink-0" style={{ width: '16vw', minWidth: 44 }}>
          <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: '#181818', border: '1px solid #222' }}>
            {isPlaying && (
              <motion.div className="absolute inset-0"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(14,165,233,0.5), transparent)' }}
                animate={{ x: ['110%', '-110%'] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }} />
            )}
          </div>
          <p className="text-center mt-2 text-[8px] tracking-widest uppercase" style={{ color: '#222' }}>
            {isPlaying ? '■■' : tracks.length && ready ? '▶' : ''}
          </p>
        </div>

        {/* Right reel */}
        <motion.div className="cursor-pointer" style={{ width: '37vw', maxWidth: 160, height: '37vw', maxHeight: 160 }}
          onClick={togglePlay} whileTap={{ scale: 0.93 }}>
          <Reel spinning={isPlaying} direction={-1} />
        </motion.div>

        {/* Glow */}
        {isPlaying && (
          <motion.div className="absolute inset-0 pointer-events-none"
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            style={{ background: 'radial-gradient(ellipse at 50% 90%, rgba(124,58,237,0.1), transparent 65%)' }} />
        )}
      </div>

      {/* Cassette alignment holes */}
      <div className="flex-shrink-0 flex items-center justify-center gap-6 pb-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-2 h-1 rounded-full" style={{ background: '#1a1a1a' }} />
        ))}
      </div>

      {/* 80s stripe bottom */}
      <div className="h-3 flex-shrink-0 overflow-hidden">
        <div className="flex h-full skew-x-6 scale-x-110 -ml-2">
          {['#60c8f0','#b060d0','#60c8f0','#b060d0','#60c8f0','#b060d0','#60c8f0','#b060d0','#60c8f0'].map((c, i) => (
            <div key={i} className="flex-1 h-full" style={{ background: c }} />
          ))}
        </div>
      </div>

      {/* Chrome bottom */}
      <div className="h-2 flex-shrink-0" style={{ background: 'linear-gradient(0deg, #404040 0%, #1a1a1a 100%)' }} />
    </div>
  )
}
