'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, SkipBack, SkipForward, SpeakerHigh, SpeakerLow } from '@phosphor-icons/react'

declare global {
  interface Window {
    Spotify: {
      Player: new (options: {
        name: string
        getOAuthToken: (cb: (token: string) => void) => void
        volume?: number
      }) => SpotifySDKPlayer
    }
    onSpotifyWebPlaybackSDKReady: () => void
  }
}

interface SpotifySDKPlayer {
  connect(): Promise<boolean>
  disconnect(): void
  addListener(event: string, cb: (data: any) => void): void
  getCurrentState(): Promise<SpotifySDKState | null>
  setVolume(volume: number): Promise<void>
  pause(): Promise<void>
  resume(): Promise<void>
  nextTrack(): Promise<void>
  previousTrack(): Promise<void>
  seek(position: number): Promise<void>
}

interface SpotifySDKState {
  paused: boolean
  position: number
  duration: number
  track_window: {
    current_track: {
      name: string
      uri: string
      duration_ms: number
      artists: { name: string }[]
      album: { name: string; images: { url: string }[] }
    }
  }
}

export function MiniPlayer() {
  const { data: session } = useSession()
  const [state, setState] = useState<SpotifySDKState | null>(null)
  const [volume, setVolume] = useState(0.5)
  const [position, setPosition] = useState(0)
  const playerRef = useRef<SpotifySDKPlayer | null>(null)
  const positionRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startTick = useCallback((from: number) => {
    positionRef.current = from
    setPosition(from)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      positionRef.current += 250
      setPosition(positionRef.current)
    }, 250)
  }, [])

  const stopTick = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!session?.accessToken) return

    const token = session.accessToken as string

    const initPlayer = () => {
      if (playerRef.current) return

      const player = new window.Spotify.Player({
        name: 'Spotify Dash',
        getOAuthToken: (cb) => cb(token),
        volume: 0.5,
      })

      player.addListener('ready', async ({ device_id }: { device_id: string }) => {
        await fetch('https://api.spotify.com/v1/me/player', {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ device_ids: [device_id] }),
        })
      })

      player.addListener('player_state_changed', (s: SpotifySDKState | null) => {
        if (!s) return
        setState(s)
        if (!s.paused) {
          startTick(s.position)
        } else {
          stopTick()
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
      stopTick()
      playerRef.current?.disconnect()
      playerRef.current = null
    }
  }, [session?.accessToken, startTick, stopTick])

  const track = state?.track_window?.current_track
  if (!track) return null

  const duration = track.duration_ms || 1
  const progressPercent = Math.min((position / duration) * 100, 100)

  const fmt = (ms: number) => {
    const s = Math.floor(ms / 1000)
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pos = Math.round(((e.clientX - rect.left) / rect.width) * duration)
    positionRef.current = pos
    setPosition(pos)
    playerRef.current?.seek(pos)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-900/95 backdrop-blur-xl"
      >
        {/* Clickable progress bar at top edge */}
        <div className="w-full h-1 bg-zinc-800 cursor-pointer group" onClick={handleSeek}>
          <div
            className="h-full bg-emerald-500 group-hover:bg-emerald-400 transition-colors"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-3 flex items-center gap-4">
          {/* Track info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {track.album?.images?.[0] && (
              <img
                src={track.album.images[0].url}
                alt={track.name}
                className="w-10 h-10 rounded object-cover flex-shrink-0"
              />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{track.name}</p>
              <p className="text-xs text-zinc-400 truncate">
                {track.artists?.map((a) => a.name).join(', ')}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => playerRef.current?.previousTrack()}
              className="text-zinc-400 hover:text-white transition-colors active:scale-95"
            >
              <SkipBack size={20} weight="fill" />
            </button>

            <button
              onClick={() =>
                state?.paused
                  ? playerRef.current?.resume()
                  : playerRef.current?.pause()
              }
              className="w-9 h-9 rounded-full bg-white hover:bg-zinc-200 transition-colors flex items-center justify-center text-black active:scale-95"
            >
              {state?.paused ? (
                <Play size={16} weight="fill" />
              ) : (
                <Pause size={16} weight="fill" />
              )}
            </button>

            <button
              onClick={() => playerRef.current?.nextTrack()}
              className="text-zinc-400 hover:text-white transition-colors active:scale-95"
            >
              <SkipForward size={20} weight="fill" />
            </button>
          </div>

          {/* Time + Volume */}
          <div className="hidden md:flex items-center gap-3 flex-1 justify-end">
            <span className="text-xs text-zinc-500 tabular-nums">
              {fmt(position)} / {fmt(duration)}
            </span>
            <div className="flex items-center gap-2">
              <SpeakerLow size={14} className="text-zinc-500" />
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => {
                  const v = parseFloat(e.target.value)
                  setVolume(v)
                  playerRef.current?.setVolume(v)
                }}
                className="w-20 accent-emerald-500 cursor-pointer"
              />
              <SpeakerHigh size={14} className="text-zinc-500" />
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
