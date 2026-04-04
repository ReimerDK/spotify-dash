'use client'

import { motion } from 'framer-motion'

interface LoadingCardProps {
  className?: string
  count?: number
}

export function LoadingCard({ className = '', count = 1 }: LoadingCardProps) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, idx) => (
        <motion.div
          key={idx}
          className="rounded-2xl bg-gradient-to-r from-zinc-800/50 to-zinc-800/30 p-4 mb-3"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, delay: idx * 0.1 }}
        >
          <div className="h-4 bg-zinc-700/50 rounded w-3/4 mb-3" />
          <div className="h-3 bg-zinc-700/50 rounded w-1/2" />
        </motion.div>
      ))}
    </div>
  )
}

export function LoadingSkeleton() {
  return (
    <div className="rounded-3xl border border-slate-200/10 bg-white/[0.02] p-8">
      <motion.div
        className="h-8 bg-zinc-800/50 rounded-lg mb-6 w-1/3"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.div className="space-y-4">
        {[0, 1, 2, 3].map((idx) => (
          <motion.div
            key={idx}
            className="h-12 bg-zinc-800/50 rounded-lg"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: idx * 0.1 }}
          />
        ))}
      </motion.div>
    </div>
  )
}
