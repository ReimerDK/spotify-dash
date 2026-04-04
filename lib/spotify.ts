const SPOTIFY_API_BASE = 'https://api.spotify.com/v1'

export interface SpotifyError {
  error: string
  message?: string
}

async function spotifyFetch<T>(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${SPOTIFY_API_BASE}${endpoint}`

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const text = await response.text()
      console.error('Spotify API error', response.status, text)
      throw new Error(`Spotify API ${response.status}: ${text.substring(0, 200)}`)
    }

    const data = await response.json()
    return data
  } catch (e: any) {
    console.error('Error in spotifyFetch for', endpoint, ':', String(e).substring(0, 300))
    throw e
  }
}

export async function getTopTracks(token: string, limit = 20) {
  return spotifyFetch<any>(
    `/me/top/tracks?limit=${limit}&time_range=medium_term`,
    token
  )
}

export async function getTopArtists(token: string, limit = 20) {
  return spotifyFetch<any>(
    `/me/top/artists?limit=${limit}&time_range=medium_term`,
    token
  )
}

export async function getCurrentlyPlaying(token: string) {
  try {
    return await spotifyFetch<any>('/me/player/currently-playing', token)
  } catch (error) {
    return null
  }
}

export async function getRecentlyPlayed(token: string, limit = 20) {
  return spotifyFetch<any>(`/me/player/recently-played?limit=${limit}`, token)
}

export async function getUserPlaylists(token: string, limit = 20) {
  return spotifyFetch<any>(`/me/playlists?limit=${limit}`, token)
}

export async function getRecommendedPlaylists(token: string) {
  return spotifyFetch<any>('/browse/featured-playlists?limit=10', token)
}

export async function searchSpotify(
  token: string,
  query: string,
  types: string[] = ['track', 'artist', 'playlist'],
  limit = 20
) {
  const typeString = types.join(',')
  const encodedQuery = encodeURIComponent(query)
  return spotifyFetch<any>(
    `/search?q=${encodedQuery}&type=${typeString}&limit=${limit}`,
    token
  )
}

export async function getUserProfile(token: string) {
  return spotifyFetch<any>('/me', token)
}

export async function getArtistTopTracks(token: string, artistId: string) {
  // Get artist info first to get the artist name
  const artistUrl = `https://api.spotify.com/v1/artists/${artistId}`
  const artistRes = await fetch(artistUrl, {
    headers: { 'Authorization': `Bearer ${token}` }
  })

  if (!artistRes.ok) {
    throw new Error('Could not fetch artist')
  }

  const artist = await artistRes.json()

  // Search for the artist's top tracks using search API
  const query = encodeURIComponent(`artist:"${artist.name}"`)
  const searchUrl = `https://api.spotify.com/v1/search?q=${query}&type=track&limit=10`

  const searchRes = await fetch(searchUrl, {
    headers: { 'Authorization': `Bearer ${token}` }
  })

  if (!searchRes.ok) {
    throw new Error('Search failed')
  }

  const searchData = await searchRes.json()

  // Return in the same format as the top-tracks endpoint
  return {
    tracks: searchData.tracks?.items || []
  }
}

async function spotifyCommand(endpoint: string, token: string, method: string, body?: object) {
  const url = `${SPOTIFY_API_BASE}${endpoint}`
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!response.ok && response.status !== 204) {
    throw { error: `Spotify API Error: ${response.status}` }
  }
}

export const playerPlay = (token: string) => spotifyCommand('/me/player/play', token, 'PUT')
export const playerPause = (token: string) => spotifyCommand('/me/player/pause', token, 'PUT')
export const playerNext = (token: string) => spotifyCommand('/me/player/next', token, 'POST')
export const playerPrevious = (token: string) => spotifyCommand('/me/player/previous', token, 'POST')
export const playerSeek = (token: string, position_ms: number) =>
  spotifyCommand(`/me/player/seek?position_ms=${position_ms}`, token, 'PUT')
export const playerPlayUris = (token: string, uris: string[]) =>
  spotifyCommand('/me/player/play', token, 'PUT', { uris })
export const playerPlayContext = (token: string, context_uri: string) =>
  spotifyCommand('/me/player/play', token, 'PUT', { context_uri })
