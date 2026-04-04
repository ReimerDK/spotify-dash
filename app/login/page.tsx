'use client'

import { signIn } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { MusicNote } from '@phosphor-icons/react'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async () => {
    setIsLoading(true)
    await signIn('spotify', { callbackUrl: '/' })
  }

  return (
    <div className="min-h-[100dvh] bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center">
              <MusicNote size={32} weight="fill" className="text-zinc-950" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl tracking-tighter leading-none font-bold mb-4">
            Spotify Dash
          </h1>
          <p className="text-zinc-400 text-lg">
            Your personal music dashboard
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl border border-slate-200/10 bg-white/[0.02] backdrop-blur-xl shadow-diffusion p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-3">Welcome</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Connect your Spotify account to see your top tracks, artists, playlists, and more.
            </p>
          </div>

          <button
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-semibold py-3 px-6 rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Connecting...' : 'Connect with Spotify'}
          </button>

          <p className="text-zinc-500 text-xs mt-6 text-center">
            We only access your public profile and saved preferences
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-zinc-600 text-sm mt-8">
          Built with Next.js, React & Tailwind CSS
        </p>
      </div>
    </div>
  )
}
