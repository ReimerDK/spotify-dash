# Spotify Dash - Project Context for Claude

## Project Overview

A full-stack Spotify dashboard web app built with Next.js 14. Users authenticate via Spotify OAuth and see their top artists, top tracks, currently playing music, playlists, and can search Spotify in real-time.

**GitHub:** https://github.com/ReimerDK/spotify-dash  
**Status:** ✅ MVP Complete, running locally on port 3002, ready for Vercel deployment

## Quick Start

```bash
npm run dev  # Starts on http://localhost:3002
```

Environment variables in `.env.local` (not committed to git):
- `SPOTIFY_CLIENT_ID` & `SPOTIFY_CLIENT_SECRET` from Spotify Dashboard
- `NEXTAUTH_SECRET` (generate with: `openssl rand -base64 32`)
- `NEXTAUTH_URL` & `SPOTIFY_REDIRECT_URI`

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v3 (dark theme, emerald-500 accent)
- **Animations**: Framer Motion with spring physics
- **Auth**: NextAuth.js v5 with Spotify OAuth
- **State**: Zustand (section visibility toggles in localStorage)
- **API**: Spotify Web API via NextAuth session tokens
- **Icons**: Phosphor Icons v2

## Architecture

### Key Components

| File | Purpose |
|------|---------|
| `app/page.tsx` | Dashboard (main page, 'use client') |
| `app/login/page.tsx` | Login page with Spotify button |
| `app/api/auth/[...nextauth].ts` | OAuth config, JWT callback adds accessToken to session |
| `lib/spotify.ts` | Spotify API client (fetch wrapper with bearer token) |
| `lib/store.ts` | Zustand store: section visibility toggles, localStorage |
| `app/components/Header.tsx` | Nav bar, user menu, settings button |
| `app/components/ControlPanel.tsx` | Settings sidebar (Framer Motion slide-in) |
| `app/components/sections/*.tsx` | 5 isolated client components (TopArtists, TopTracks, CurrentlyPlaying, Playlists, Search) |

### Data Flow

1. User logs in → Spotify OAuth redirect → NextAuth creates JWT session with `accessToken`
2. Each section component mounts → fetches from `/api/spotify/*`
3. API route gets token from session → calls Spotify API → returns JSON
4. Component displays data with loading/error states
5. ControlPanel toggles visibility stored in Zustand + localStorage

## Design System

- **Color**: bg-zinc-950 (dark base), emerald-500 (accent), slate-200/10 (borders)
- **Typography**: Geist sans-serif (no Inter), tracking-tighter for headings
- **Layout**: Asymmetric CSS Grid (md:grid-cols-3 with varied col-spans)
- **Mobile**: Collapses to single column below `md:` breakpoint
- **Animations**: Framer Motion springs (stiffness: 100, damping: 20)

## Common Tasks

### Add a new dashboard section
1. Create `app/components/sections/[Name].tsx` (isolated 'use client')
2. Add to Zustand store in `lib/store.ts`
3. Create API route `app/api/spotify/[name].ts`
4. Import & add to grid in `app/page.tsx`
5. Add checkbox to ControlPanel.tsx

### Change Spotify API scopes
- Edit `SpotifyProvider({ authorization: { params: { scope: [...]}}})` in `app/api/auth/[...nextauth].ts`
- Users must re-authenticate

### Deploy to Vercel
- See README.md "Deploy to Vercel" section (step-by-step)
- Key: set all 5 env vars + update Spotify redirect URI

## Performance

- Section components are isolated 'use client' to prevent cascading re-renders
- Zustand + localStorage for instant UI updates (no server roundtrip for toggles)
- Framer Motion uses `transform` & `opacity` (GPU-accelerated)
- API calls cached by browser (fetch runs once per mount)

## Known Limitations

- Currently Playing updates every 5s (not real-time)
- No offline support
- No recently played section (easy to add)
- Search doesn't show multiple result types simultaneously (could improve UX)

## Vercel Deployment Checklist

- [ ] Push to GitHub (already done)
- [ ] Go to vercel.com/new → import spotify-dash repo
- [ ] Add 5 environment variables (with Vercel domain URLs)
- [ ] Register Vercel callback URI in Spotify Dashboard
- [ ] Deploy and test login flow
- [ ] Test OAuth redirect doesn't infinite loop

## Notes for Future Sessions

- User prefers terse responses, no summaries
- Use markdown [file.tsx](app/file.tsx) links for file refs
- Don't over-engineer; only implement what's requested
- This uses design-taste-frontend principles (asymmetric layouts, spring physics, glassmorphism)
- .env.local is gitignored; .env.example shows template for others
