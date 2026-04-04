import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'Missing artist id' }, { status: 400 })

  const session = await getServerSession(authOptions)
  if (!session?.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const res = await fetch(
    `https://api.spotify.com/v1/artists/${id}/top-tracks?market=from_token`,
    { headers: { Authorization: `Bearer ${session.accessToken}` } }
  )
  const data = await res.json()
  if (!res.ok) return NextResponse.json({ error: data?.error?.message || 'Failed' }, { status: res.status })

  return NextResponse.json(data)
}
