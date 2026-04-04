'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { LoadingSkeleton } from '@/app/components/LoadingCard'
import { MusicNote, Play, Pause, SkipBack, SkipForward } from '@phosphor-icons/react'

interface CurrentTrack {
  item: {
    name: string
    artists: { name: string }[]
    album: { images: { url: string }[] }
    external_urls: { spotify: string }
    duration_ms?: number
  } | null
  is_playing: boolean
  progress_ms: number
}

async function sendPlayerCommand(action: string, extra?: object) {
  await fetch('/api/spotify/player', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...extra }),
  })
}

export function CurrentlyPlaying() {
  const [data, setData] = useState<CurrentTrack | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const progressRef = useRef(0)

  const fetchData = async () => {
    try {
      const res = await fetch('/api/spotify/currently-playing')
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json)
      setProgress(json.progress_ms ?? 0)
      progressRef.current = json.progress_ms ?? 0
    } catch {
      setError('Could not load currently playing')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (data?.is_playing) {
      const interval = setInterval(() => {
        progressRef.current += 100
        setProgress(progressRef.current)
      }, 100)
      return () => clearInterval(interval)
    }
  }, [data?.is_playing, data?.item?.name])

  const handlePlay = async () => {
    setData((d) => d ? { ...d, is_playing: true } : d)
    await sendPlayerCommand('play')
  }

  const handlePause = async () => {
    setData((d) => d ? { ...d, is_playing: false } : d)
    await sendPlayerCommand('pause')
  }

  const handleNext = async () => {
    await sendPlayerCommand('next')
    setTimeout(fetchData, 400)
  }

  const handlePrevious = async () => {
    await sendPlayerCommand('previous')
    setTimeout(fetchData, 400)
  }

  const handleSeek = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!data?.item?.duration_ms) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    const position_ms = Math.round(ratio * data.item.duration_ms)
    setProgress(position_ms)
    progressRef.current = position_ms
    await sendPlayerCommand('seek', { position_ms })
  }

  if (loading) return <LoadingSkeleton />

  if (error) {
    return (
      <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center">
        <p className="text-red-400">{error}</p>
      </div>
    )
  }

  if (!data?.item) {
    return (
      <div className="rounded-3xl border border-slate-200/10 bg-white/[0.02] backdrop-blur p-8 flex items-center gap-4 justify-center">
        <MusicNote size={20} className="text-zinc-400" />
        <p className="text-zinc-400">Nothing playing right now</p>
      </div>
    )
  }

  const { item } = data
  const duration = item.duration_ms || 1
  const progressPercent = Math.min((progress / duration) * 100, 100)

  const fmt = (ms: number) => {
    const s = Math.floor(ms / 1000)
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-3xl border border-slate-200/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur overflow-hidden"
    >
      <div className="relative">
        {item.album?.images?.[0] && (
          <div className="relative">
            <img
              src={item.album.images[0].url}
              alt={item.name}
              className="w-full aspect-square object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
          </div>
        )}

        <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <motion.div
                animate={data.is_playing ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                transition={{ duration: 1, repeat: Infinity }}
                className={`w-2 h-2 rounded-full ${data.is_playing ? 'bg-emerald-500' : 'bg-zinc-500'}`}
              />
              <span className={`text-xs font-semibold ${data.is_playing ? 'text-emerald-400' : 'text-zinc-400'}`}>
                {data.is_playing ? 'PLAYING' : 'PAUSED'}
              </span>
            </div>
            <h2 className="text-2xl font-bold mb-2 line-clamp-2">{item.name}</h2>
            <p className="text-sm text-zinc-300">
              {item.artists?.map((a) => a.name).join(', ')}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Controls + Progress */}
      <div className="px-6 py-4 bg-black/30 space-y-3">
        {/* Progress bar */}
        <div>
          <div
            className="w-full h-1 bg-zinc-700/50 rounded-full overflow-hidden cursor-pointer group"
            onClick={handleSeek}
          >
            <motion.div
              className="h-full bg-emerald-500 group-hover:bg-emerald-400 transition-colors"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ type: 'tween', duration: 0.1 }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-zinc-500">{fmt(progress)}</span>
            <span className="text-[10px] text-zinc-500">{fmt(duration)}</span>
          </div>
        </div>

        {/* Playback buttons */}
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={handlePrevious}
            className="text-zinc-400 hover:text-white transition-colors"
            aria-label="Previous"
          >
            <SkipBack size={22} weight="fill" />
          </button>

          <button
            onClick={data.is_playing ? handlePause : handlePlay}
            className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-400 transition-colors flex items-center justify-center text-black"
            aria-label={data.is_playing ? 'Pause' : 'Play'}
          >
            {data.is_playing
              ? <Pause size={18} weight="fill" />
              : <Play size={18} weight="fill" />}
          </button>

          <button
            onClick={handleNext}
            className="text-zinc-400 hover:text-white transition-colors"
            aria-label="Next"
          >
            <SkipForward size={22} weight="fill" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
