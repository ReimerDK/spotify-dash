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

### Production Build Locally

```bash
npm run build
npm start
```

### Deploy to Vercel

#### Step 1: Create Vercel Project

1. Go to [Vercel New Project](https://vercel.com/new)
2. Select "Import Git Repository"
3. Find and select `spotify-dash`
4. Click "Import"

#### Step 2: Configure Environment Variables

In Vercel dashboard, go to **Settings → Environment Variables** and add:

```
NEXTAUTH_URL=https://<your-vercel-domain>.vercel.app
NEXTAUTH_SECRET=<generate: openssl rand -base64 32>
SPOTIFY_CLIENT_ID=<your_spotify_client_id>
SPOTIFY_CLIENT_SECRET=<your_spotify_client_secret>
SPOTIFY_REDIRECT_URI=https://<your-vercel-domain>.vercel.app/api/auth/callback/spotify
```

#### Step 3: Update Spotify Developer Settings

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Select your app
3. Go to **Edit Settings**
4. Add new Redirect URI:
   ```
   https://<your-vercel-domain>.vercel.app/api/auth/callback/spotify
   ```
5. Save

#### Step 4: Deploy

1. Click **Deploy** in Vercel
2. Wait for deployment to complete
3. Visit your live app!

#### Environment Variables Reference

| Variable | Example | Notes |
|----------|---------|-------|
| `NEXTAUTH_URL` | `https://spotify-dash-abc123.vercel.app` | Your Vercel domain |
| `NEXTAUTH_SECRET` | (generated) | Generate with `openssl rand -base64 32` |
| `SPOTIFY_CLIENT_ID` | From Spotify Dashboard | Keep secret! |
| `SPOTIFY_CLIENT_SECRET` | From Spotify Dashboard | Keep secret! |
| `SPOTIFY_REDIRECT_URI` | Must match Spotify settings | Critical for OAuth flow |

### Continuous Deployment

Once connected to Vercel:
- Every push to `main` branch auto-deploys
- Pull requests get preview deployments
- Easy rollbacks if needed

### Troubleshooting Deployment

**Login loop or "invalid callback"?**
- Verify `SPOTIFY_REDIRECT_URI` matches exactly in both Vercel and Spotify Dashboard
- Check `NEXTAUTH_URL` is correct (no trailing slash)

**"Invalid Client" error?**
- Verify `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` are correct
- Check they're not swapped

**API calls return 401?**
- Session tokens expire - ensure `NEXTAUTH_SECRET` is set
- Session data not persisting - check environment variables are applied

## License

MIT
