# IronFlex Forum/Blog

## Overview
Russian-language fitness forum/blog with Lexical rich text editor. Supabase for everything (Postgres + Auth + Storage), self-hosted on VPS (`db.tarnovsky.ru`).

## Tech Stack
- **Framework:** Next.js 15 (Turbopack for dev, standalone for prod)
- **Database:** Self-hosted Supabase (Postgres + Studio) on `db.tarnovsky.ru`
- **Auth:** Supabase Auth with custom JWT layer
- **Storage:** Supabase Storage `Forum` bucket (file uploads)
- **Editor:** Lexical (rich text)
- **Deploy:** PM2 `iron-blog` on port 3000, nginx reverse proxy 80/443

## Commands
```bash
npm run dev        # Dev with Turbopack
npm run build      # Production build
npm run admin:make <email>  # Promote a user to admin (reads .env.local)
```

## Production deploy (VPS)
```bash
ssh iron-blog-vps
cd /root/iron-blog
git pull
npm ci
npm run build
pm2 restart iron-blog
```
