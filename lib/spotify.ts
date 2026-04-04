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
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw {
      error: `Spotify API Error: ${response.status}`,
      message: error.error?.message || response.statusText,
    } as SpotifyError
  }

  return response.json()
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
