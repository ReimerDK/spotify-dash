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

// Reel SVG — realistic spoke wheel
function Reel({ spinning, direction = 1 }: { spinning: boolean; direction?: 1 | -1 }) {
  return (
    <motion.div
      className="w-full h-full"
      animate={spinning ? { rotate: 360 * direction } : {}}
      transition={{ duration: 3, repeat: spinning ? Infinity : 0, ease: 'linear' }}
    >
      <svg viewBox="0 0 120 120" className="w-full h-full">
        {/* Outer rim */}
        <circle cx="60" cy="60" r="58" fill="#161616" stroke="#3a3a3a" strokeWidth="1.5" />
        {/* Grip texture ring */}
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i / 24) * Math.PI * 2
          const x1 = 60 + 52 * Math.cos(angle), y1 = 60 + 52 * Math.sin(angle)
          const x2 = 60 + 56 * Math.cos(angle), y2 = 60 + 56 * Math.sin(angle)
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#2a2a2a" strokeWidth="1" />
        })}
        {/* Inner circle */}
        <circle cx="60" cy="60" r="40" fill="#111" stroke="#2e2e2e" strokeWidth="1" />
        {/* Spokes */}
        {[0, 60, 120, 180, 240, 300].map(deg => {
          const rad = (deg - 90) * Math.PI / 180
          return (
            <line key={deg}
              x1={60 + 12 * Math.cos(rad)} y1={60 + 12 * Math.sin(rad)}
              x2={60 + 36 * Math.cos(rad)} y2={60 + 36 * Math.sin(rad)}
              stroke="#3d3d3d" strokeWidth="3" strokeLinecap="round" />
          )
        })}
        {/* Hub */}
        <circle cx="60" cy="60" r="12" fill="#1a1a1a" stroke="#404040" strokeWidth="1.5" />
        <circle cx="60" cy="60" r="5" fill="#2d2d2d" stroke="#555" strokeWidth="1" />
        {/* Hub triangle holes */}
        {[0, 120, 240].map(deg => {
          const rad = (deg - 90) * Math.PI / 180
          return <circle key={deg} cx={60 + 8 * Math.cos(rad)} cy={60 + 8 * Math.sin(rad)} r="2.5" fill="#0a0a0a" />
        })}
      </svg>
    </motion.div>
  )
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
    return () => { if (timerRef.current) clearInterval(timerRef.current); playerRef.current?.disconnect(); playerRef.current = null }
  }, [session?.accessToken])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault(); if (!searchInput.trim()) return
    setLoading(true); setTracks([]); setIsPlaying(false); setShowSearch(false); setPosition(0)
    try {
      const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(searchInput)}&type=artist&limit=1`)
      const data = await res.json(); const artist = data.artists?.items?.[0]; if (!artist) return
      setArtistName(artist.name)
      const tr = await fetch(`/api/spotify/artist-top-tracks?id=${artist.id}`)
      const td = await tr.json(); setTracks(td.tracks?.slice(0, 10) || []); setCurrentIndex(0)
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
    <div
      className="min-h-[100dvh] w-full flex flex-col overflow-hidden relative select-none"
      style={{ background: '#0f0f0f' }}
    >
      {/* ── CASSETTE SHELL TEXTURE ── */}
      {/* Top chrome edge */}
      <div className="h-2 flex-shrink-0" style={{ background: 'linear-gradient(180deg, #3a3a3a, #1e1e1e)' }} />

      {/* ── LABEL AREA — all UI lives here ── */}
      <div className="flex-1 flex flex-col mx-4 mt-3 mb-0 relative" style={{ minHeight: 0 }}>
        {/* Label body */}
        <div
          className="flex-1 flex flex-col rounded-t-2xl overflow-hidden relative"
          style={{ background: 'linear-gradient(170deg, #e8e0d4 0%, #d9cfc0 100%)' }}
        >
          {/* 80s accent stripe — top of label */}
          <div className="h-3 flex-shrink-0 overflow-hidden">
            <div className="flex h-full w-[120%] -ml-4 -skew-x-6">
              {['#b060d0','#60c8f0','#b060d0','#60c8f0','#b060d0','#60c8f0','#b060d0','#60c8f0'].map((c, i) => (
                <div key={i} className="flex-1 h-full" style={{ background: c }} />
              ))}
            </div>
          </div>

          {/* Inner label content */}
          <div className="flex-1 flex flex-col px-5 pt-4 pb-3" style={{ minHeight: 0 }}>
            {/* Branding row */}
            <div className="flex items-baseline justify-between mb-4 flex-shrink-0">
              <h1 className="font-black text-2xl tracking-[0.14em]" style={{ color: '#1a1a1a', fontFamily: 'var(--font-geist-sans)' }}>
                WALK<span style={{ color: '#7c3aed' }}>·</span>MAN
              </h1>
              <span className="text-[9px] tracking-[0.22em] uppercase font-semibold" style={{ color: '#888' }}>
                Stereo
              </span>
            </div>

            {/* Track info */}
            <div className="flex-shrink-0 mb-4">
              <AnimatePresence mode="wait">
                <motion.p key={currentTrack?.id || 'empty'}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                  className="font-bold leading-tight text-xl truncate"
                  style={{ color: '#111', letterSpacing: '-0.01em' }}>
                  {currentTrack?.name || (loading ? 'Searching…' : !ready ? 'Loading…' : '—')}
                </motion.p>
              </AnimatePresence>
              <p className="text-sm mt-0.5 truncate" style={{ color: '#888' }}>
                {currentTrack?.artists.map(a => a.name).join(', ') || artistName || 'Search for an artist'}
              </p>
            </div>

            {/* Progress */}
            <div className="flex-shrink-0 mb-5">
              <div
                className="h-px w-full rounded-full overflow-hidden cursor-pointer"
                style={{ background: '#c8bfb0' }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #7c3aed, #0ea5e9)' }}
                  transition={{ duration: 0.25, ease: 'linear' }}
                />
              </div>
              <div className="flex justify-between mt-1" style={{ color: '#aaa' }}>
                <span className="text-[10px] font-mono tabular-nums">{fmt(position)}</span>
                <span className="text-[10px] font-mono tabular-nums">{currentTrack ? fmt(duration) : '0:00'}</span>
              </div>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-3 flex-shrink-0 mb-5">
              <SpeakerLow size={12} weight="light" style={{ color: '#aaa', flexShrink: 0 }} />
              <div className="relative flex-1 h-px" style={{ background: '#c8bfb0' }}>
                <input
                  type="range" min={0} max={1} step={0.02} value={volume}
                  onChange={e => { const v = parseFloat(e.target.value); setVolume(v); playerRef.current?.setVolume(v) }}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer h-4 -top-2"
                />
                <div className="h-full rounded-full" style={{ width: `${volume * 100}%`, background: '#7c3aed' }} />
              </div>
              <SpeakerHigh size={12} weight="light" style={{ color: '#aaa', flexShrink: 0 }} />
            </div>

            {/* Skip controls + utility icons */}
            <div className="flex items-center justify-between flex-shrink-0 mt-auto">
              <div className="flex items-center gap-5">
                <motion.button whileTap={{ scale: 0.82 }}
                  onClick={() => play(currentIndex === 0 ? tracks.length - 1 : currentIndex - 1)}
                  disabled={!tracks.length}
                  className="disabled:opacity-25 transition-opacity"
                  style={{ color: '#555' }}>
                  <SkipBack size={20} weight="light" />
                </motion.button>
                <motion.button whileTap={{ scale: 0.82 }}
                  onClick={() => play((currentIndex + 1) % tracks.length)}
                  disabled={!tracks.length}
                  className="disabled:opacity-25 transition-opacity"
                  style={{ color: '#555' }}>
                  <SkipForward size={20} weight="light" />
                </motion.button>
              </div>

              <div className="flex items-center gap-4">
                <motion.button whileTap={{ scale: 0.82 }}
                  onClick={() => { setShowSearch(!showSearch); setShowTracks(false) }}
                  style={{ color: showSearch ? '#7c3aed' : '#aaa' }}>
                  <MagnifyingGlass size={18} weight="light" />
                </motion.button>
                <motion.button whileTap={{ scale: 0.82 }}
                  onClick={() => { setShowTracks(!showTracks); setShowSearch(false) }}
                  disabled={!tracks.length}
                  className="disabled:opacity-25 transition-colors"
                  style={{ color: showTracks ? '#7c3aed' : '#aaa' }}>
                  <List size={18} weight="light" />
                </motion.button>
              </div>
            </div>

            {/* Search input */}
            <AnimatePresence>
              {showSearch && (
                <motion.form
                  key="search"
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 40 }} exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                  onSubmit={handleSearch} className="overflow-hidden flex-shrink-0 mt-3"
                >
                  <div className="relative border-b" style={{ borderColor: '#bbb' }}>
                    <input autoFocus type="text" placeholder="Artist name…" value={searchInput}
                      onChange={e => setSearchInput(e.target.value)}
                      className="w-full bg-transparent text-sm py-1.5 focus:outline-none placeholder-stone-400"
                      style={{ color: '#222', fontFamily: 'var(--font-geist-sans)' }} />
                    <button type="submit" className="absolute right-0 top-1/2 -translate-y-1/2" style={{ color: '#7c3aed' }}>
                      <MagnifyingGlass size={14} weight="light" />
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Track list */}
            <AnimatePresence>
              {showTracks && tracks.length > 0 && (
                <motion.div
                  key="tracks"
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                  className="overflow-hidden flex-shrink-0 mt-3"
                >
                  <div className="overflow-y-auto" style={{ maxHeight: 140 }}>
                    {tracks.map((track, idx) => (
                      <button key={track.id}
                        onClick={() => { play(idx); setShowTracks(false) }}
                        className="w-full text-left py-1.5 flex items-center gap-2 border-b"
                        style={{ borderColor: '#d0c8bc', color: currentIndex === idx ? '#7c3aed' : '#555' }}>
                        <span className="font-mono text-[10px] w-4 flex-shrink-0 text-right" style={{ color: '#bbb' }}>{idx + 1}</span>
                        <span className="flex-1 truncate text-xs">{track.name}</span>
                        <span className="text-[10px] flex-shrink-0 font-mono tabular-nums" style={{ color: '#bbb' }}>{fmt(track.duration_ms)}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom accent stripe */}
          <div className="h-2 flex-shrink-0 overflow-hidden">
            <div className="flex h-full w-[120%] -ml-4 skew-x-6">
              {['#60c8f0','#b060d0','#60c8f0','#b060d0','#60c8f0','#b060d0','#60c8f0','#b060d0'].map((c, i) => (
                <div key={i} className="flex-1 h-full" style={{ background: c }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── REEL AREA — fills remaining height ── */}
      <div
        className="flex-shrink-0 flex items-center justify-center relative"
        style={{ height: '36vh', minHeight: 160 }}
      >
        {/* Tap target hint */}
        {tracks.length > 0 && ready && (
          <p className="absolute top-0 left-1/2 -translate-x-1/2 text-[9px] tracking-[0.2em] uppercase mt-2 pointer-events-none"
            style={{ color: '#2a2a2a' }}>
            {isPlaying ? '▮ tap reel to pause' : '▶ tap reel to play'}
          </p>
        )}

        {/* Left reel */}
        <motion.div
          className="cursor-pointer"
          style={{ width: '38vw', maxWidth: 170, height: '38vw', maxHeight: 170 }}
          onClick={togglePlay}
          whileTap={{ scale: 0.94 }}
        >
          <Reel spinning={isPlaying} direction={1} />
        </motion.div>

        {/* Tape bridge */}
        <div className="flex flex-col items-center gap-1 px-2" style={{ width: '14vw', minWidth: 40 }}>
          <div className="w-full h-1 rounded-full" style={{ background: '#1e1e1e', border: '1px solid #2a2a2a' }}>
            {isPlaying && (
              <motion.div className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, transparent, #0ea5e9, transparent)' }}
                animate={{ x: ['100%', '-100%'] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              />
            )}
          </div>
        </div>

        {/* Right reel */}
        <motion.div
          className="cursor-pointer"
          style={{ width: '38vw', maxWidth: 170, height: '38vw', maxHeight: 170 }}
          onClick={togglePlay}
          whileTap={{ scale: 0.94 }}
        >
          <Reel spinning={isPlaying} direction={-1} />
        </motion.div>

        {/* Playing glow underneath reels */}
        {isPlaying && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{ opacity: [0, 0.4, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ background: 'radial-gradient(ellipse at 50% 80%, rgba(124,58,237,0.12), transparent 70%)' }}
          />
        )}
      </div>

      {/* Bottom cassette holes row */}
      <div className="flex-shrink-0 flex items-center justify-center gap-8 pb-4 pt-1">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-2 h-1 rounded-full" style={{ background: '#222' }} />
        ))}
      </div>

      {/* Bottom chrome edge */}
      <div className="h-2 flex-shrink-0" style={{ background: 'linear-gradient(0deg, #3a3a3a, #1e1e1e)' }} />
    </div>
  )
}
