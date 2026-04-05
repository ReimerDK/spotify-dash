'use client'

import { motion } from 'framer-motion'
import { Play, Pause, SkipBack, SkipForward } from '@phosphor-icons/react'

interface WalkmanProps {
  artistName?: string
  artistImage?: string
  isPlaying: boolean
  currentTrack?: {
    name: string
    artists: { name: string }[]
    duration_ms: number
  }
  onPlayNext: () => void
  onPlayPrev: () => void
}

export function Walkman({
  artistName = 'Select an artist',
  artistImage,
  isPlaying,
  currentTrack,
  onPlayNext,
  onPlayPrev,
}: WalkmanProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      className="relative w-full max-w-md"
    >
      {/* Main Device Body */}
      <div className="relative bg-gradient-to-b from-yellow-100 to-yellow-200 rounded-3xl p-8 shadow-2xl border-8 border-yellow-300/50 aspect-[9/16]">
        {/* Metallic Top Rim */}
        <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-gray-300 to-gray-200 rounded-t-3xl border-b-2 border-gray-400/50" />

        <div className="h-full flex flex-col">
          {/* Speaker Area Top */}
          <div className="flex items-center justify-center gap-1 mb-4">
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={`speaker-${i}`}
                animate={isPlaying ? { scaleY: [1, 1.2, 1] } : {}}
                transition={{
                  duration: 0.5,
                  repeat: isPlaying ? Infinity : 0,
                  delay: i * 0.1,
                }}
                className="w-1.5 h-12 bg-gradient-to-b from-yellow-600 to-yellow-700 rounded-full shadow-md"
              />
            ))}
          </div>

          {/* Cassette Deck */}
          <div className="flex-1 flex flex-col items-center justify-center mb-6">
            <div className="w-48 h-40 relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl p-6 shadow-inner border-4 border-gray-700">
              {/* Cassette Tape */}
              <div className="absolute inset-0 flex items-center justify-center gap-4 p-6">
                {/* Left Reel */}
                <motion.div
                  animate={isPlaying ? { rotate: 360 } : {}}
                  transition={{
                    duration: 2,
                    repeat: isPlaying ? Infinity : 0,
                    ease: 'linear',
                  }}
                  className="w-16 h-16 rounded-full border-4 border-gray-600 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center"
                >
                  <div className="w-10 h-10 rounded-full border-3 border-gray-500 bg-gray-800" />
                </motion.div>

                {/* Tape Strip */}
                <div className="flex-1 h-4 bg-gradient-to-r from-gray-600 to-gray-800 rounded-sm relative overflow-hidden shadow-md">
                  {isPlaying && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-30"
                      animate={{ x: ['100%', '-100%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    />
                  )}
                </div>

                {/* Right Reel */}
                <motion.div
                  animate={isPlaying ? { rotate: -360 } : {}}
                  transition={{
                    duration: 2,
                    repeat: isPlaying ? Infinity : 0,
                    ease: 'linear',
                  }}
                  className="w-16 h-16 rounded-full border-4 border-gray-600 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center"
                >
                  <div className="w-10 h-10 rounded-full border-3 border-gray-500 bg-gray-800" />
                </motion.div>
              </div>

              {/* Artist Info on Cassette */}
              <div className="absolute bottom-3 left-4 right-4 text-center">
                <p className="text-xs font-bold text-gray-300 truncate">{artistName}</p>
              </div>
            </div>

            {/* Artist Image Display */}
            {artistImage && (
              <motion.div
                animate={isPlaying ? { rotateY: [0, 360] } : {}}
                transition={{ duration: 3, repeat: isPlaying ? Infinity : 0, ease: 'linear' }}
                className="mt-6 w-32 h-32 rounded-xl overflow-hidden border-4 border-yellow-300 shadow-lg"
              >
                <img
                  src={artistImage}
                  alt={artistName}
                  className="w-full h-full object-cover"
                />
              </motion.div>
            )}

            {/* Track Title Display */}
            {currentTrack && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 w-full text-center px-4"
              >
                <p className="text-xs text-yellow-900 font-mono uppercase tracking-wider mb-1">Now Playing</p>
                <p className="text-sm font-bold text-yellow-950 line-clamp-2">{currentTrack.name}</p>
              </motion.div>
            )}
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onPlayPrev}
              className="p-3 rounded-full bg-yellow-400 hover:bg-yellow-300 text-yellow-950 font-bold transition-colors shadow-lg"
            >
              <SkipBack size={20} weight="fill" />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.85 }}
              className={`p-4 rounded-full font-bold transition-colors shadow-lg ${
                isPlaying
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isPlaying ? <Pause size={24} weight="fill" /> : <Play size={24} weight="fill" />}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onPlayNext}
              className="p-3 rounded-full bg-yellow-400 hover:bg-yellow-300 text-yellow-950 font-bold transition-colors shadow-lg"
            >
              <SkipForward size={20} weight="fill" />
            </motion.button>
          </div>

          {/* Volume Slider Indicator */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-xs text-yellow-900 font-mono">VOL</span>
            <div className="w-32 h-2 bg-yellow-300 rounded-full shadow-inner flex items-center px-1">
              <motion.div
                animate={isPlaying ? { width: ['10%', '80%', '10%'] } : { width: '40%' }}
                transition={{
                  duration: 2,
                  repeat: isPlaying ? Infinity : 0,
                  ease: 'easeInOut',
                }}
                className="h-full bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full"
              />
            </div>
          </div>

          {/* Model/Brand Text */}
          <div className="text-center pb-2">
            <p className="text-xs font-bold text-yellow-900 tracking-widest">SPOTIFY</p>
            <p className="text-[10px] text-yellow-800 font-mono">WALKMAN Pro</p>
          </div>
        </div>

        {/* Metallic Bottom Rim */}
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-b from-gray-200 to-gray-300 rounded-b-3xl border-t-2 border-gray-400/50" />
      </div>

      {/* Subtle Shadow/Shine Effect */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-transparent via-white/10 to-white/20 pointer-events-none" />
    </motion.div>
  )
}
