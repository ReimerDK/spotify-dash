import { type NextAuthOptions } from 'next-auth'
import SpotifyProvider from 'next-auth/providers/spotify'

export const authOptions: NextAuthOptions = {
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID || '',
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',
      authorization: {
        params: {
          scope: [
            'user-top-read',
            'user-read-currently-playing',
            'user-read-playback-state',
            'user-modify-playback-state',
            'user-read-recently-played',
            'playlist-read-private',
            'user-library-read',
            'streaming',
            'user-read-private',
            'user-read-email',
          ].join(' '),
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken
      session.refreshToken = token.refreshToken
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
}
