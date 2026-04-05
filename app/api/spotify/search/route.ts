import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')

    if (!query) {
      return NextResponse.json({ error: 'Missing search query' }, { status: 400 })
    }

    const session = await getServerSession(authOptions)

    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const type = searchParams.get('type') || 'track,artist,playlist'
    const limit = searchParams.get('limit') || '10'
    const encodedQuery = encodeURIComponent(query)
    const spotifyRes = await fetch(
      `https://api.spotify.com/v1/search?q=${encodedQuery}&type=${type}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      }
    )

    const body = await spotifyRes.json()

    if (!spotifyRes.ok) {
      console.error('Spotify search failed:', spotifyRes.status, JSON.stringify(body))
      return NextResponse.json(
        { error: body?.error?.message || `Spotify error ${spotifyRes.status}` },
        { status: spotifyRes.status }
      )
    }

    return NextResponse.json(body)
  } catch (error: any) {
    console.error('Search route error:', error?.message || String(error))
    return NextResponse.json({ error: 'Failed to search' }, { status: 500 })
  }
}
