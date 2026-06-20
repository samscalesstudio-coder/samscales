# Samscales Barber Shop — Website

A four-page animated website for **Samscales Barber Shop** — *Sharp Cuts. Clean Fades.* (Est. 2026, Dasuya, Hoshiarpur, Punjab).

## Pages
- **Home** (`index.html`) — cinematic scroll experience driven by canvas video frames (GSAP + Lenis), 3D accents, animated counters
- **Services** (`services.html`) — services with 3D icon cards; click any service to book it
- **Booking** (`booking.html`) — appointment form (name, phone, email, date/time, request) → WhatsApp; live hours
- **About** (`about.html`) — story, the four pillars, owner & salon photos

## Tech
Plain HTML/CSS/JS — no build step. Libraries via CDN: GSAP, ScrollTrigger, Lenis, Three.js.

All shop contact details live in one place: the `SHOP` object in [`js/site.js`](js/site.js).

## Run locally
```bash
node serve.mjs        # serves at http://localhost:3000
```

## Deploy
Static site — works on GitHub Pages, Netlify, or Vercel with no configuration.
