'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ArrowFatLinesLeft, ArrowFatLinesRight, MagnifyingGlass, List, SpeakerLow, SpeakerHigh } from '@phosphor-icons/react'
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
  id: string
  uri: string
  name: string
  artists: { name: string }[]
  duration_ms: number
  album: { images: { url: string }[] }
}

function fmt(ms: number) {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
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
        if (!s.paused) {
          positionRef.current = s.position
          setPosition(s.position)
          if (timerRef.current) clearInterval(timerRef.current)
          timerRef.current = setInterval(() => {
            positionRef.current += 250
            setPosition(positionRef.current)
          }, 250)
        } else {
          if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
          setPosition(s.position)
        }
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

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      playerRef.current?.disconnect()
      playerRef.current = null
    }
  }, [session?.accessToken])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchInput.trim()) return
    setLoading(true); setTracks([]); setIsPlaying(false); setShowSearch(false); setPosition(0)
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
    } finally { setLoading(false) }
  }

  const play = async (index: number) => {
    if (!tracks[index] || !session?.accessToken) return
    setCurrentIndex(index); setPosition(0)
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
    if (isPlaying) { playerRef.current?.pause() } else { play(currentIndex) }
  }

  const handleVolume = (v: number) => { setVolume(v); playerRef.current?.setVolume(v) }

  const currentTrack = tracks[currentIndex]
  const duration = currentTrack?.duration_ms || 1
  const progress = Math.min((position / duration) * 100, 100)

  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ background: '#111' }}>

      {/* TOP STRIPE — 80s pink/cyan */}
      <div className="h-5 overflow-hidden flex-shrink-0">
        <div className="flex h-full -skew-x-12 -ml-4 scale-x-110">
          {['#c084fc','#38bdf8','#c084fc','#38bdf8','#c084fc','#38bdf8','#c084fc'].map((c, i) => (
            <div key={i} className="flex-1 h-full" style={{ background: c }} />
          ))}
        </div>
      </div>

      {/* HEADER */}
      <div className="flex items-center justify-between px-6 pt-4 pb-2 flex-shrink-0">
        <h1 className="text-3xl font-black tracking-widest text-white" style={{ letterSpacing: '0.12em' }}>
          WALK<span style={{ color: '#38bdf8' }}>·</span>MAN
        </h1>
        <div className="flex items-center gap-2 text-right">
          <p className="text-[9px] tracking-widest uppercase text-gray-600 leading-tight">
            Stereo<br />Cassette
          </p>
        </div>
      </div>

      {/* CASSETTE — tap to play/pause, fills center */}
      <div className="flex-1 flex items-center justify-center px-6 py-2">
        <motion.div
          className="w-full max-w-sm cursor-pointer"
          style={{ aspectRatio: '1.6 / 1' }}
          onClick={togglePlay}
          whileTap={{ scale: 0.97 }}
        >
          {/* Cassette outer shell */}
          <div className="w-full h-full rounded-2xl border-2 relative overflow-hidden flex flex-col"
            style={{ background: '#1c1c1c', borderColor: '#333' }}>

            {/* Cassette label */}
            <div className="absolute inset-3 rounded-xl flex flex-col items-center justify-center gap-2 border"
              style={{ background: '#0e0e0e', borderColor: '#2a2a2a' }}>

              {/* Artist label on cassette */}
              <p className="text-[9px] font-bold tracking-widest uppercase" style={{ color: '#c084fc' }}>
                {artistName || 'STEREO'}
              </p>

              {/* Reels row */}
              <div className="flex items-center gap-4 w-full px-4 justify-center">

                {/* Left reel */}
                <motion.div
                  animate={isPlaying ? { rotate: 360 } : {}}
                  transition={{ duration: 2.5, repeat: isPlaying ? Infinity : 0, ease: 'linear' }}
                  style={{ width: 72, height: 72, flexShrink: 0 }}
                >
                  <svg viewBox="0 0 72 72" className="w-full h-full">
                    <circle cx="36" cy="36" r="35" fill="#1a1a1a" stroke="#404040" strokeWidth="1.5" />
                    <circle cx="36" cy="36" r="22" fill="none" stroke="#303030" strokeWidth="1" />
                    {[0,40,80,120,160,200,240,280,320].map(deg => (
                      <line key={deg}
                        x1="36" y1="36"
                        x2={36 + 22 * Math.cos((deg - 90) * Math.PI / 180)}
                        y2={36 + 22 * Math.sin((deg - 90) * Math.PI / 180)}
                        stroke="#484848" strokeWidth="2" />
                    ))}
                    <circle cx="36" cy="36" r="9" fill="#111" stroke="#555" strokeWidth="1.5" />
                    <circle cx="36" cy="36" r="4" fill="#444" />
                  </svg>
                </motion.div>

                {/* Tape window */}
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div className="w-full h-5 rounded-sm relative overflow-hidden border"
                    style={{ background: '#080808', borderColor: '#333' }}>
                    {/* Tape strands */}
                    {[15,30,45,60,75].map(p => (
                      <div key={p} className="absolute inset-y-0 w-px" style={{ left: `${p}%`, background: '#1e1e1e' }} />
                    ))}
                    {/* Shimmer when playing */}
                    {isPlaying && (
                      <motion.div
                        className="absolute inset-0"
                        style={{ background: 'linear-gradient(90deg, transparent, rgba(56,189,248,0.35), transparent)' }}
                        animate={{ x: ['110%', '-110%'] }}
                        transition={{ duration: 1.0, repeat: Infinity, ease: 'linear' }}
                      />
                    )}
                  </div>
                  <p className="text-[7px] font-mono" style={{ color: '#333' }}>
                    {currentTrack ? 'TYPE II / 60' : 'Normal Bias'}
                  </p>
                </div>

                {/* Right reel */}
                <motion.div
                  animate={isPlaying ? { rotate: -360 } : {}}
                  transition={{ duration: 2.5, repeat: isPlaying ? Infinity : 0, ease: 'linear' }}
                  style={{ width: 72, height: 72, flexShrink: 0 }}
                >
                  <svg viewBox="0 0 72 72" className="w-full h-full">
                    <circle cx="36" cy="36" r="35" fill="#1a1a1a" stroke="#404040" strokeWidth="1.5" />
                    <circle cx="36" cy="36" r="22" fill="none" stroke="#303030" strokeWidth="1" />
                    {[0,40,80,120,160,200,240,280,320].map(deg => (
                      <line key={deg}
                        x1="36" y1="36"
                        x2={36 + 22 * Math.cos((deg - 90) * Math.PI / 180)}
                        y2={36 + 22 * Math.sin((deg - 90) * Math.PI / 180)}
                        stroke="#484848" strokeWidth="2" />
                    ))}
                    <circle cx="36" cy="36" r="9" fill="#111" stroke="#555" strokeWidth="1.5" />
                    <circle cx="36" cy="36" r="4" fill="#444" />
                  </svg>
                </motion.div>
              </div>

              {/* Tap hint */}
              <p className="text-[8px] tracking-widest uppercase" style={{ color: '#2a2a2a' }}>
                {isPlaying ? '▮▮ tap to pause' : tracks.length ? '▶ tap to play' : ''}
              </p>
            </div>

            {/* Bottom center notch */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-2 rounded-t"
              style={{ background: '#0e0e0e' }} />

            {/* Playing glow */}
            {isPlaying && (
              <motion.div className="absolute inset-0 rounded-2xl pointer-events-none"
                animate={{ boxShadow: ['0 0 0 rgba(192,132,252,0)', '0 0 40px rgba(192,132,252,0.12)', '0 0 0 rgba(192,132,252,0)'] }}
                transition={{ duration: 2, repeat: Infinity }} />
            )}
          </div>
        </motion.div>
      </div>

      {/* TRACK INFO */}
      <div className="px-6 pb-2 flex-shrink-0">
        <AnimatePresence mode="wait">
          <motion.div key={currentTrack?.id || 'empty'}
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <p className="text-white font-bold text-lg leading-tight truncate">
              {currentTrack?.name || (loading ? 'Searching…' : !ready ? 'Loading player…' : 'Tap search to start')}
            </p>
            <p className="text-sm mt-0.5 truncate" style={{ color: '#555' }}>
              {currentTrack?.artists.map(a => a.name).join(', ') || artistName || ''}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-[10px] font-mono mb-1" style={{ color: '#444' }}>
            <span>{fmt(position)}</span>
            <span>{currentTrack ? fmt(duration) : '0:00'}</span>
          </div>
          <div className="h-px w-full rounded-full overflow-hidden" style={{ background: '#2a2a2a' }}>
            <motion.div className="h-full rounded-full"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #c084fc, #38bdf8)' }} />
          </div>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="px-6 py-3 flex items-center justify-center gap-10 flex-shrink-0">
        <motion.button whileTap={{ scale: 0.85 }}
          onClick={() => play(currentIndex === 0 ? tracks.length - 1 : currentIndex - 1)}
          disabled={!tracks.length}
          className="disabled:opacity-30 transition-opacity"
          style={{ color: '#555' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => (e.currentTarget.style.color = '#555')}
        >
          <ArrowFatLinesLeft size={28} weight="fill" />
        </motion.button>

        <motion.button whileTap={{ scale: 0.85 }}
          onClick={() => play((currentIndex + 1) % tracks.length)}
          disabled={!tracks.length}
          className="disabled:opacity-30 transition-opacity"
          style={{ color: '#555' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => (e.currentTarget.style.color = '#555')}
        >
          <ArrowFatLinesRight size={28} weight="fill" />
        </motion.button>
      </div>

      {/* VOLUME */}
      <div className="px-6 pb-3 flex items-center gap-3 flex-shrink-0">
        <SpeakerLow size={14} style={{ color: '#444', flexShrink: 0 }} />
        <input type="range" min={0} max={1} step={0.02} value={volume}
          onChange={e => handleVolume(parseFloat(e.target.value))}
          className="flex-1 cursor-pointer"
          style={{ accentColor: '#c084fc', height: '2px' }}
        />
        <SpeakerHigh size={14} style={{ color: '#444', flexShrink: 0 }} />
      </div>

      {/* BOTTOM TOOLS — search + tracklist */}
      <div className="px-6 pb-4 flex items-center gap-4 flex-shrink-0">
        <button onClick={() => { setShowSearch(!showSearch); setShowTracks(false) }}
          className="transition-colors"
          style={{ color: showSearch ? '#c084fc' : '#444' }}>
          <MagnifyingGlass size={20} />
        </button>
        <button onClick={() => { setShowTracks(!showTracks); setShowSearch(false) }}
          disabled={!tracks.length}
          className="transition-colors disabled:opacity-20"
          style={{ color: showTracks ? '#c084fc' : '#444' }}>
          <List size={20} />
        </button>
      </div>

      {/* Search overlay */}
      <AnimatePresence>
        {showSearch && (
          <motion.form
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            onSubmit={handleSearch}
            className="px-6 pb-4 flex-shrink-0"
          >
            <div className="relative border-b" style={{ borderColor: '#333' }}>
              <input
                autoFocus type="text" placeholder="Search artist…"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="w-full bg-transparent text-white text-sm py-2 focus:outline-none placeholder-gray-700"
              />
              <button type="submit" className="absolute right-0 top-1/2 -translate-y-1/2" style={{ color: '#c084fc' }}>
                <MagnifyingGlass size={16} />
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Track list overlay */}
      <AnimatePresence>
        {showTracks && tracks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="px-4 pb-4 flex-shrink-0 max-h-52 overflow-y-auto"
          >
            {tracks.map((track, idx) => (
              <button key={track.id}
                onClick={() => { play(idx); setShowTracks(false) }}
                className="w-full text-left py-2 px-2 flex items-center gap-3 text-sm rounded-lg transition-colors border-b"
                style={{
                  color: currentIndex === idx ? '#c084fc' : '#666',
                  borderColor: '#1e1e1e',
                  background: currentIndex === idx ? 'rgba(192,132,252,0.05)' : 'transparent',
                }}>
                <span className="font-mono text-xs w-5 flex-shrink-0" style={{ color: '#333' }}>{idx + 1}</span>
                <span className="flex-1 truncate">{track.name}</span>
                <span className="text-xs flex-shrink-0" style={{ color: '#333' }}>{fmt(track.duration_ms)}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* BOTTOM STRIPE */}
      <div className="h-4 overflow-hidden flex-shrink-0 mt-auto">
        <div className="flex h-full -skew-x-12 -ml-4 scale-x-110">
          {['#38bdf8','#c084fc','#38bdf8','#c084fc','#38bdf8','#c084fc','#38bdf8'].map((c, i) => (
            <div key={i} className="flex-1 h-full" style={{ background: c }} />
          ))}
        </div>
      </div>
    </div>
  )
}
