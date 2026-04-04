'use client'

import { useDashboardStore } from '@/lib/store'
import { X, ArrowCounterClockwise } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'

interface ControlPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function ControlPanel({ isOpen, onClose }: ControlPanelProps) {
  const { sections, toggleSection, resetSections } = useDashboardStore()

  const sectionLabels = {
    topArtists: 'Top Artists',
    topTracks: 'Top Tracks',
    currentlyPlaying: 'Currently Playing',
    playlists: 'Playlists',
    search: 'Search',
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-[100dvh] w-full max-w-sm z-50 bg-zinc-900 border-l border-slate-200/10"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-heading"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200/10">
              <h2 className="text-xl font-bold" id="settings-heading">Settings</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-zinc-50"
                aria-label="Close settings"
              >
                <X size={24} aria-hidden="true" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto h-[calc(100%-140px)]">
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">
                  Dashboard Sections
                </h3>
                <div className="space-y-3">
                  {Object.entries(sectionLabels).map(([key, label]) => (
                    <label
                      key={key}
                      className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-zinc-800 transition-colors group"
                    >
                      <input
                        type="checkbox"
                        checked={sections[key as keyof typeof sections]}
                        onChange={() =>
                          toggleSection(key as keyof typeof sections)
                        }
                        className="w-5 h-5 rounded bg-zinc-800 border border-slate-200/20 cursor-pointer accent-emerald-500"
                      />
                      <span className="text-sm font-medium">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-200/10 pt-6">
                <button
                  onClick={resetSections}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm font-medium transition-colors text-zinc-300 hover:text-zinc-50"
                  aria-label="Reset all sections to default visibility"
                >
                  <ArrowCounterClockwise size={18} aria-hidden="true" />
                  Reset to Defaults
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-slate-200/10 bg-zinc-900">
              <p className="text-xs text-zinc-500">
                Your preferences are saved automatically
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
