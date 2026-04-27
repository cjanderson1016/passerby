# Passerby

Passerby is a social web app built with React, TypeScript, and Vite, with Supabase for authentication and database storage, and Cloudflare R2 for media storage.

## Stack

- React 19 + TypeScript
- Vite
- React Router
- Supabase (auth, database)
- Cloudflare R2 (media storage)

## Prerequisites

- Node.js 18+
- npm

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create a `.env.local` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_R2_PUBLIC_URL=your_cloudflare_r2_bucket_public_url
```

3. Start the dev server:

```bash
npm run dev
```

## Scripts

- `npm run dev` - Start local dev server
- `npm run build` - Type-check and build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Deploy

This project is configured for Vercel with SPA rewrite support in `vercel.json`.
