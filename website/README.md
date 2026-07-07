# Aunaria — Web Frontend

> Next Generation Hytale Experience · Walker Crew Studio

[![Website](https://img.shields.io/badge/website-aunaria.net-7b52f4?style=flat-square)](https://aunaria.net)
[![Status](https://img.shields.io/badge/status-maintenance-f5c842?style=flat-square)](#)
[![Studio](https://img.shields.io/badge/by-Walker%20Crew%20Studio-3ecf8e?style=flat-square)](#)

The official website for the **Aunaria** Hytale server. A dark space-themed frontend featuring server information, VIP ranks, player authentication, and the Serverix admin portal integration.

## Features

- **Hero section** — server tagline, CTA buttons, animated background
- **Game Modes** — Survival, Slimefun 2.0, Skyblock (coming soon)
- **VIP Ranks** — Basic / Premium / Ultra with pricing
- **Player Services** — Reports, Support Tickets, Recruitments (auth-gated)
- **Auth Modal** — Hytale nick + password + Discord OAuth
- **Profile Modal** — Serverix-style player dashboard (stats, linked accounts, level progress)
- **Admin Modal** — Serverix admin panel login with 2FA

## Tech

Pure HTML5 · CSS3 · Vanilla JS · Font Awesome 6 · Google Fonts (Oswald + Roboto)

No build step required.

## Setup

```bash
# Just open in browser
open index.html

# Or serve locally
npx serve .
# → http://localhost:3000
```

## Deployment

Drag & drop the folder to [Netlify](https://netlify.com) or upload to any static host.

```bash
# Vercel CLI
vercel deploy
```

## Structure

```
website/
├── index.html          Main page
├── style.css           All styles (dark space theme)
└── assets/             Logos, images
```

## Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--accent` | `#7b52f4` | Primary purple |
| `--teal` | `#3ecfcf` | Secondary accent |
| `--gold` | `#f5c842` | Status / VIP Ultra |
| `--bg-void` | `#06060f` | Page background |

---

*© 2026 Walker Crew Studio. Aunaria is not affiliated with Hypixel Studios.*
