import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { searchSpotify } from '@/lib/spotify'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')

    if (!query) {
      return NextResponse.json(
        { error: 'Missing search query' },
        { status: 400 }
      )
    }

    const session = await getServerSession(authOptions)

    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await searchSpotify(session.accessToken as string, query)
    return NextResponse.json(data)
  } catch (error: any) {
    const message = error?.message || error?.error || JSON.stringify(error) || 'Failed to search'
    console.error('Search error:', message)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
