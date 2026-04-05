'use client'

import { motion } from 'framer-motion'
import { Play, Pause, SkipBack, SkipForward, MagnifyingGlass, CaretDown, CaretUp } from '@phosphor-icons/react'
import { useState } from 'react'

interface Track {
  id: string
  name: string
  artists: { name: string }[]
  duration_ms: number
  album: { images: { url: string }[] }
}

interface WalkmanProps {
  artistName?: string
  artistImage?: string
  isPlaying: boolean
  currentTrack?: Track
  currentTrackIndex: number
  tracks: Track[]
  onSearch: (query: string) => Promise<void>
  onPlayTrack: (index: number) => Promise<void>
  onTogglePlay: () => void
  onPlayNext: () => void
  onPlayPrev: () => void
  loading: boolean
  error?: string | null
}

export function Walkman({
  artistName = 'Select artist',
  artistImage,
  isPlaying,
  currentTrack,
  currentTrackIndex,
  tracks,
  onSearch,
  onPlayTrack,
  onTogglePlay,
  onPlayNext,
  onPlayPrev,
  loading,
  error,
}: WalkmanProps) {
  const [searchInput, setSearchInput] = useState('')
  const [showTracks, setShowTracks] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchInput.trim()) return
    await onSearch(searchInput)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 20 }}
      className="w-full max-w-sm mx-auto"
    >
      {/* Main Walkman Body */}
      <div className="relative bg-gradient-to-b from-yellow-100 via-yellow-50 to-yellow-100 rounded-2xl shadow-2xl p-6 aspect-[3/4] border-8 border-yellow-300/60 flex flex-col">
        {/* Top Trim */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-b from-gray-400 to-gray-300 rounded-t-xl border-b border-gray-500/30" />

        {/* Display Area */}
        <div className="mt-2 mb-4 p-3 bg-gray-900 rounded-lg border-2 border-gray-800 shadow-inner">
          {error ? (
            <p className="text-xs text-red-400 font-mono line-clamp-2">{error}</p>
          ) : (
            <>
              <p className="text-[10px] text-yellow-600 font-mono uppercase tracking-wider mb-1">
                {artistName.slice(0, 16)}
              </p>
              <p className="text-xs text-yellow-100 font-semibold line-clamp-2 h-8">
                {currentTrack?.name || 'Ready'}
              </p>
            </>
          )}
        </div>

        {/* Cassette Area */}
        <div className="flex-1 flex items-center justify-center mb-4 bg-gray-900 rounded-xl p-4 border-4 border-gray-800 relative overflow-hidden">
          {/* Animated Reels */}
          <div className="flex items-center justify-center gap-3 w-full">
            <motion.div
              animate={isPlaying ? { rotate: 360 } : {}}
              transition={{ duration: 2, repeat: isPlaying ? Infinity : 0, ease: 'linear' }}
              className="w-12 h-12 rounded-full border-3 border-gray-600 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center flex-shrink-0"
            >
              <div className="w-7 h-7 rounded-full border-2 border-gray-500 bg-gray-900" />
            </motion.div>

            {/* Tape */}
            <div className="flex-1 h-3 bg-gradient-to-r from-gray-700 to-gray-800 rounded-sm relative overflow-hidden">
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
              className="w-12 h-12 rounded-full border-3 border-gray-600 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center flex-shrink-0"
            >
              <div className="w-7 h-7 rounded-full border-2 border-gray-500 bg-gray-900" />
            </motion.div>
          </div>
        </div>

        {/* Track List Dropdown */}
        {tracks.length > 0 && (
          <motion.div className="mb-4 bg-gray-900 rounded-lg border-2 border-gray-800 overflow-hidden">
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
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                className="max-h-32 overflow-y-auto border-t border-gray-800"
              >
                {tracks.slice(0, 8).map((track, idx) => (
                  <button
                    key={track.id}
                    onClick={() => {
                      onPlayTrack(idx)
                      setShowTracks(false)
                    }}
                    className={`w-full text-left px-3 py-1.5 text-[10px] border-t border-gray-800 transition-colors ${
                      currentTrackIndex === idx
                        ? 'bg-yellow-500/30 text-yellow-100'
                        : 'text-yellow-400 hover:bg-gray-800'
                    }`}
                  >
                    <span className="font-mono text-yellow-600">{idx + 1}.</span> {track.name.slice(0, 20)}
                  </button>
                ))}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Search Box */}
        <form onSubmit={handleSearch} className="mb-3 relative">
          <input
            type="text"
            placeholder="Artist..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            maxLength={20}
            className="w-full px-2 py-1.5 text-xs rounded bg-yellow-50 border border-yellow-300 text-yellow-900 placeholder-yellow-600/60 focus:outline-none focus:border-yellow-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-yellow-600 hover:text-yellow-700 disabled:opacity-50"
          >
            <MagnifyingGlass size={14} weight="bold" />
          </button>
        </form>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={onPlayPrev}
            className="p-1.5 rounded-full bg-yellow-400 hover:bg-yellow-300 text-yellow-950 transition-colors"
            title="Previous"
          >
            <SkipBack size={14} weight="fill" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={tracks.length > 0 ? onTogglePlay : undefined}
            className={`p-2 rounded-full font-bold transition-colors ${
              isPlaying
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            } ${tracks.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={16} weight="fill" /> : <Play size={16} weight="fill" />}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={onPlayNext}
            className="p-1.5 rounded-full bg-yellow-400 hover:bg-yellow-300 text-yellow-950 transition-colors"
            title="Next"
          >
            <SkipForward size={14} weight="fill" />
          </motion.button>
        </div>

        {/* Volume Indicator */}
        <div className="flex items-center justify-center gap-1">
          <span className="text-[9px] text-yellow-900 font-mono font-bold">VOL</span>
          <div className="flex-1 h-1.5 bg-yellow-300 rounded-full shadow-inner flex items-center px-0.5">
            <motion.div
              animate={isPlaying ? { width: ['15%', '70%', '15%'] } : { width: '30%' }}
              transition={{
                duration: 2,
                repeat: isPlaying ? Infinity : 0,
                ease: 'easeInOut',
              }}
              className="h-full bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full"
            />
          </div>
        </div>

        {/* Brand Text */}
        <div className="text-center mt-2 text-[9px] text-yellow-900 font-bold tracking-widest">
          SPOTIFY WALKMAN
        </div>

        {/* Bottom Trim */}
        <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-b from-gray-300 to-gray-400 rounded-b-xl border-t border-gray-500/30" />
      </div>

      {/* Shine Effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-transparent via-white/10 to-white/20 pointer-events-none" />
    </motion.div>
  )
}
