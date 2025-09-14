# Spektif Agency

Modern project management platform built with Next.js and NestJS.

## Features

- Kanban board management
- Real-time collaboration
- Team chat system
- Calendar integration
- Task tracking
- Multi-language support (Turkish, English, Polish)

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: NestJS, PostgreSQL, Prisma
- **Authentication**: NextAuth.js
- **Deployment**: Vercel + Supabase

## Quick Start

1. Install dependencies:
```bash
bun install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

3. Start development servers:
```bash
# Backend
cd apps/api && bun run start:dev

# Frontend  
cd apps/web && bun run dev
```

## Deployment

This application is configured for deployment on:
- Frontend: Vercel
- Database: Supabase
- File Storage: Supabase Storage

## License

Private project - All rights reserved.