import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { playerPlay, playerPause, playerNext, playerPrevious, playerSeek } from '@/lib/spotify'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { action, position_ms } = await req.json()

  try {
    switch (action) {
      case 'play':
        await playerPlay(session.accessToken)
        break
      case 'pause':
        await playerPause(session.accessToken)
        break
      case 'next':
        await playerNext(session.accessToken)
        break
      case 'previous':
        await playerPrevious(session.accessToken)
        break
      case 'seek':
        await playerSeek(session.accessToken, position_ms)
        break
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Playback command failed' }, { status: 500 })
  }
}
