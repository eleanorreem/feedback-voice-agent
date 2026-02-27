# Frontend

The Next.js web application for the Voice Reflective Journal. Built with [React 19](https://react.dev), [Tailwind CSS 4](https://tailwindcss.com), and [Shadcn/ui](https://ui.shadcn.com). Voice interface powered by [LiveKit](https://livekit.io) components.

## Features

- Email/password authentication with JWT sessions
- Dashboard showing past reflections
- Real-time voice sessions with an animated cat avatar
- Summary review after each session
- Light/dark theme with system preference detection

## Setup

```bash
cp .env.example .env.local    # then fill in your credentials
pnpm install
pnpm dev
```

Open http://localhost:3000.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Format with Prettier |

## Project Structure

```
frontend/
├── app/               Next.js app router pages and API routes
│   ├── api/           REST endpoints (auth, reflections, connection-details)
│   └── page.tsx       Main page
├── components/
│   ├── agents-ui/     LiveKit Agents UI components
│   ├── ai-elements/   AI element components
│   ├── app/           App-specific components (session, dashboard, cat avatar)
│   └── ui/            Shadcn/ui primitives
├── lib/               Auth, database, utilities
├── styles/            Global CSS and theme variables
└── .env.example       Environment variable template
```

## Key Components

| File | Description |
|------|-------------|
| `components/app/view-controller.tsx` | Manages phase transitions: dashboard, session, summary review |
| `components/app/session-view.tsx` | LiveKit session setup, voice UI, and control bar |
| `components/app/cat-avatar.tsx` | Animated SVG cat that speaks with the agent |
| `components/app/tile-layout.tsx` | Media tile layout with agent audio visualization |

## Customising Components

Agents UI and Shadcn components are installed locally in `components/` and can be modified directly. To update Agents UI components to the latest version:

```bash
pnpm shadcn:install
```
