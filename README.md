# 🎵 Spotify Dash

A beautiful, modern Spotify dashboard built with Next.js, React, Tailwind CSS, and Framer Motion.

## Features

- 🎤 **Top Artists** - See your most-played artists with images
- 🎵 **Top Tracks** - Browse your favorite tracks with rankings
- 🎶 **Currently Playing** - Real-time display of what's playing with album art and progress
- 📋 **Playlists** - View your saved playlists in a smooth carousel
- 🔍 **Search** - Search for artists, tracks, and playlists on Spotify
- ⚙️ **Control Panel** - Toggle sections on/off with persistent settings
- 🌙 **Dark Mode** - Premium dark theme with glassmorphism design
- ✨ **Smooth Animations** - Framer Motion micro-interactions and perpetual animations

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS v3
- **Authentication**: NextAuth.js (Spotify OAuth)
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Icons**: Phosphor Icons
- **Language**: TypeScript

## Getting Started

### 1. Prerequisites

- Node.js 18+ and npm
- Spotify Developer Account

### 2. Spotify Developer Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app or use existing one
3. Accept the terms and create
4. Note your **Client ID** and **Client Secret**
5. Add Redirect URI: `http://localhost:3000/api/auth/callback/spotify`

### 3. Environment Variables

Create a `.env.local` file:

```bash
cp .env.example .env.local
```

Fill in your Spotify credentials:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
SPOTIFY_CLIENT_ID=<your_client_id>
SPOTIFY_CLIENT_SECRET=<your_client_secret>
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/callback/spotify
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Login

Click "Connect with Spotify" and authorize the app to access your profile.

## Project Structure

```
spotify-dash/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth].ts       # OAuth configuration
│   │   └── spotify/
│   │       ├── top-artists.ts
│   │       ├── top-tracks.ts
│   │       ├── currently-playing.ts
│   │       ├── playlists.ts
│   │       └── search.ts
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── ControlPanel.tsx
│   │   └── sections/
│   │       ├── TopArtists.tsx
│   │       ├── TopTracks.tsx
│   │       ├── CurrentlyPlaying.tsx
│   │       ├── Playlists.tsx
│   │       └── Search.tsx
│   ├── login/page.tsx
│   ├── page.tsx
│   └── layout.tsx
├── lib/
│   ├── spotify.ts
│   └── store.ts
└── package.json
```

## Build & Deploy

### Production Build

```bash
npm run build
npm start
```

### Deploy to Vercel

1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables
4. Deploy

**Note**: Update `NEXTAUTH_URL` and `SPOTIFY_REDIRECT_URI` to your production domain.

## License

MIT
