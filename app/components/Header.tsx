'use client'

import { useSession, signOut } from 'next-auth/react'
import { MusicNote, SignOut, Gear } from '@phosphor-icons/react'
import { useState } from 'react'

interface HeaderProps {
  onSettingsClick: () => void
}

export function Header({ onSettingsClick }: HeaderProps) {
  const { data: session } = useSession()
  const [showMenu, setShowMenu] = useState(false)

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <header className="border-b border-slate-200/10 bg-zinc-950/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center">
            <MusicNote size={24} weight="fill" className="text-zinc-950" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Spotify Dash</h1>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Settings Button */}
          <button
            onClick={onSettingsClick}
            className="p-2 hover:bg-zinc-900 rounded-lg transition-colors text-zinc-400 hover:text-zinc-50"
            aria-label="Open settings"
            title="Settings"
          >
            <Gear size={24} aria-hidden="true" />
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-900 transition-colors"
              aria-label="User menu"
              aria-expanded={showMenu}
              aria-haspopup="menu"
            >
              {session?.user?.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span className="text-sm hidden sm:inline text-zinc-300">
                {session?.user?.name}
              </span>
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-zinc-900 border border-slate-200/10 shadow-lg">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 rounded-xl transition-colors first:rounded-t-lg last:rounded-b-lg"
                >
                  <SignOut size={18} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
