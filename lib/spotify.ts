const SPOTIFY_API_BASE = 'https://api.spotify.com/v1'

// Spotify Response Types
export interface Image {
  url: string
  height?: number
  width?: number
}

export interface Artist {
  id: string
  name: string
  uri: string
  genres?: string[]
  images?: Image[]
  popularity?: number
  external_urls?: { spotify: string }
}

export interface Album {
  id: string
  name: string
  uri: string
  images?: Image[]
  release_date?: string
}

export interface Track {
  id: string
  name: string
  uri: string
  duration_ms: number
  explicit?: boolean
  popularity?: number
  artists: Artist[]
  album: Album
  external_urls?: { spotify: string }
}

export interface Playlist {
  id: string
  name: string
  uri: string
  description?: string
  images?: Image[]
  owner?: { display_name: string }
  tracks?: { total: number }
  external_urls?: { spotify: string }
}

export interface UserProfile {
  id: string
  display_name: string
  email?: string
  images?: Image[]
  external_urls?: { spotify: string }
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  limit: number
  offset: number
  next?: string
  previous?: string
}

export interface SearchResponse {
  tracks?: PaginatedResponse<Track>
  artists?: PaginatedResponse<Artist>
  playlists?: PaginatedResponse<Playlist>
}

export interface TopTracksResponse extends PaginatedResponse<Track> {}
export interface TopArtistsResponse extends PaginatedResponse<Artist> {}
export interface ArtistTopTracksResponse {
  tracks: Track[]
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

export async function getTopTracks(token: string, limit = 20): Promise<TopTracksResponse> {
  return spotifyFetch<TopTracksResponse>(
    `/me/top/tracks?limit=${limit}&time_range=medium_term`,
    token
  )
}

export async function getTopArtists(token: string, limit = 20): Promise<TopArtistsResponse> {
  return spotifyFetch<TopArtistsResponse>(
    `/me/top/artists?limit=${limit}&time_range=medium_term`,
    token
  )
}

export async function getCurrentlyPlaying(token: string): Promise<Track | null> {
  try {
    return await spotifyFetch<Track>('/me/player/currently-playing', token)
  } catch (error) {
    return null
  }
}

export async function getRecentlyPlayed(token: string, limit = 20): Promise<PaginatedResponse<Track>> {
  return spotifyFetch<PaginatedResponse<Track>>(`/me/player/recently-played?limit=${limit}`, token)
}

export async function getUserPlaylists(token: string, limit = 20): Promise<PaginatedResponse<Playlist>> {
  return spotifyFetch<PaginatedResponse<Playlist>>(`/me/playlists?limit=${limit}`, token)
}

export async function searchSpotify(
  token: string,
  query: string,
  types: string[] = ['track', 'artist', 'playlist'],
  limit = 20
): Promise<SearchResponse> {
  const typeString = types.join(',')
  const encodedQuery = encodeURIComponent(query)
  return spotifyFetch<SearchResponse>(
    `/search?q=${encodedQuery}&type=${typeString}&limit=${limit}`,
    token
  )
}

export async function getUserProfile(token: string): Promise<UserProfile> {
  return spotifyFetch<UserProfile>('/me', token)
}

export async function getArtistTopTracks(token: string, artistId: string): Promise<ArtistTopTracksResponse> {
  // Get artist info first to get the artist name
  const artist = await spotifyFetch<Artist>(`/artists/${artistId}`, token)

  // Use search API to get artist's top tracks
  // (top-tracks endpoint requires special access, search is more reliable)
  const query = encodeURIComponent(`artist:"${artist.name}"`)
  const searchData = await spotifyFetch<SearchResponse>(
    `/search?q=${query}&type=track&limit=10`,
    token
  )

  // Return in the same format as the top-tracks endpoint
  return {
    tracks: searchData.tracks?.items || []
  }
}

async function spotifyCommand(endpoint: string, token: string, method: string, body?: object): Promise<void> {
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

export const playerPlay = (token: string): Promise<void> => spotifyCommand('/me/player/play', token, 'PUT')
export const playerPause = (token: string): Promise<void> => spotifyCommand('/me/player/pause', token, 'PUT')
export const playerNext = (token: string): Promise<void> => spotifyCommand('/me/player/next', token, 'POST')
export const playerPrevious = (token: string): Promise<void> => spotifyCommand('/me/player/previous', token, 'POST')
export const playerSeek = (token: string, position_ms: number): Promise<void> =>
  spotifyCommand(`/me/player/seek?position_ms=${position_ms}`, token, 'PUT')
export const playerPlayUris = (token: string, uris: string[]): Promise<void> =>
  spotifyCommand('/me/player/play', token, 'PUT', { uris })
export const playerPlayContext = (token: string, context_uri: string): Promise<void> =>
  spotifyCommand('/me/player/play', token, 'PUT', { context_uri })
