'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Walkman } from '@/app/components/Walkman'

export default function WalkmanPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-b from-amber-900 via-amber-950 to-yellow-950 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-yellow-700/20 border-t-yellow-700 rounded-full"
        />
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-[100dvh] bg-zinc-950 flex items-center justify-center p-4">
      <div className="relative z-10">
        <Walkman />
      </div>
    </div>
  )
}
