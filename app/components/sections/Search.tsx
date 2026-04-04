'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MagnifyingGlass } from '@phosphor-icons/react'

interface SearchResult {
  tracks?: { items: any[] }
  artists?: { items: any[] }
  playlists?: { items: any[] }
}

export function Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults(null)
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(searchQuery)}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data)
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (value: string) => {
    setQuery(value)
    handleSearch(value)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Search Music</h2>
        <div className="relative">
          <MagnifyingGlass
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search artists, tracks, playlists..."
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-zinc-900 border border-slate-200/10 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
          />
        </div>
      </div>

      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-8"
          >
            <div className="inline-block">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full"
              />
            </div>
          </motion.div>
        )}

        {!loading && results && query.trim() && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="space-y-6"
          >
            {/* Tracks */}
            {results.tracks?.items && results.tracks.items.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Tracks</h3>
                <div className="space-y-2">
                  {results.tracks.items.slice(0, 5).map((track: any, idx: number) => (
                    <motion.a
                      key={track.id}
                      href={track.external_urls?.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      {track.album?.images[0] && (
                        <img
                          src={track.album.images[0].url}
                          alt={track.name}
                          className="w-10 h-10 rounded object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{track.name}</p>
                        <p className="text-xs text-zinc-400 truncate">
                          {track.artists.map((a: any) => a.name).join(', ')}
                        </p>
                      </div>
                    </motion.a>
                  ))}
                </div>
              </div>
            )}

            {/* Artists */}
            {results.artists?.items && results.artists.items.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Artists</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {results.artists.items.slice(0, 6).map((artist: any, idx: number) => (
                    <motion.a
                      key={artist.id}
                      href={artist.external_urls?.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="rounded-lg border border-slate-200/10 bg-white/[0.02] p-3 text-center hover:bg-white/[0.05] transition-colors cursor-pointer"
                    >
                      {artist.images?.[0] && (
                        <img
                          src={artist.images[0].url}
                          alt={artist.name}
                          className="w-full aspect-square rounded-md object-cover mb-2"
                        />
                      )}
                      <p className="text-sm font-medium line-clamp-1">{artist.name}</p>
                    </motion.a>
                  ))}
                </div>
              </div>
            )}

            {/* Playlists */}
            {results.playlists?.items && results.playlists.items.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Playlists</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {results.playlists.items.slice(0, 4).map((playlist: any, idx: number) => (
                    <motion.a
                      key={playlist.id}
                      href={playlist.external_urls?.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="rounded-lg border border-slate-200/10 bg-white/[0.02] p-3 hover:bg-white/[0.05] transition-colors cursor-pointer flex items-center gap-3"
                    >
                      {playlist.images?.[0] && (
                        <img
                          src={playlist.images[0].url}
                          alt={playlist.name}
                          className="w-12 h-12 rounded object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{playlist.name}</p>
                      </div>
                    </motion.a>
                  ))}
                </div>
              </div>
            )}

            {(!results.tracks?.items || results.tracks.items.length === 0) &&
              (!results.artists?.items || results.artists.items.length === 0) &&
              (!results.playlists?.items || results.playlists.items.length === 0) && (
                <div className="text-center py-8 text-zinc-400">
                  No results found for "{query}"
                </div>
              )}
          </motion.div>
        )}

        {!loading && !query.trim() && !results && (
          <div className="text-center py-8 text-zinc-400">
            Start typing to search Spotify
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
