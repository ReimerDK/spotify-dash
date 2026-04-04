'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { LoadingSkeleton } from '@/app/components/LoadingCard'
import { MusicNote } from '@phosphor-icons/react'

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

export function CurrentlyPlaying() {
  const [data, setData] = useState<CurrentTrack | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/spotify/currently-playing')
        if (!res.ok) throw new Error('Failed to fetch')
        const json = await res.json()
        if (json.error) throw new Error(json.error)
        setData(json)
      } catch (err) {
        setError('Could not load currently playing')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (data?.item && data?.is_playing) {
      const interval = setInterval(() => {
        setProgress((prev) => prev + 100)
      }, 100)
      return () => clearInterval(interval)
    }
  }, [data])

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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-3xl border border-slate-200/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur overflow-hidden"
    >
      <div className="relative">
        {/* Album Art */}
        {item.album.images[0] && (
          <div className="relative">
            <img
              src={item.album.images[0].url}
              alt={item.name}
              className="w-full aspect-square object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
          </div>
        )}

        {/* Overlay Info */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-2 h-2 bg-emerald-500 rounded-full"
              />
              <span className="text-xs font-semibold text-emerald-400">
                {data.is_playing ? 'PLAYING' : 'PAUSED'}
              </span>
            </div>
            <h2 className="text-2xl font-bold mb-2 line-clamp-2">{item.name}</h2>
            <p className="text-sm text-zinc-300">
              {item.artists.map((a: any) => a.name).join(', ')}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-6 py-4 bg-black/30">
        <div className="w-full h-1 bg-zinc-700/50 rounded-full overflow-hidden mb-2">
          <motion.div
            className="h-full bg-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ type: 'tween', duration: 0.1 }}
          />
        </div>
        <a
          href={item.external_urls?.spotify}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors inline-block"
        >
          Open on Spotify
        </a>
      </div>
    </motion.div>
  )
}
