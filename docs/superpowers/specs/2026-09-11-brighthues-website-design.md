# Bright Hues Face Painting — Website Design

**Date:** 2026-09-11
**Status:** Approved

## Purpose

A single-page "website business card" for Emrie Cooper's face painting business, Bright Hues Face Painting. Parents will usually open it from a text message, so it must load fast on a phone and put the phone number and email one tap away. It also showcases photos of past work.

## Constraints

- Hosted on Cloudflare, deployed with Wrangler as a static-assets Worker, on a free `workers.dev` subdomain for now. A custom domain can be attached later in the dashboard.
- No backend. Contact is tap-to-call, tap-to-text, and mailto links only.
- No build step and no framework. Plain HTML, CSS, and a small amount of vanilla JS so anyone can edit the text in any editor.
- Photos are managed by dropping files in a folder and listing them in a JSON file, then redeploying.
- Mirrors the business card's colors and layout.

## Brand

Taken from the business card:

| Token | Value | Use |
|---|---|---|
| cream | `#FFEBB8` | page background, text on orange |
| orange | `#FF6B1C` | accent panels, headings, buttons |
| orange-dark | `#E55A0E` | button hover, borders |
| ink | `#3A2A1A` | body text on cream |
| rainbow | red `#F28B82`, orange `#F9B36A`, yellow `#F6E27A`, green `#A8D8A0`, blue `#8FC1E3`, purple `#B9A6E0` | rainbow SVG, gallery placeholder tiles, small accents |

Headline font: Poppins (bold, uppercase for the wordmark), loaded from Google Fonts with a system sans-serif fallback. Body: Poppins regular.

Content from the card: "Emrie Cooper", "Birthday parties, any event, call to hire now!", `brighthuesfacepaint@gmail.com`, `(435) 357-1166`.

## Page structure

Single `index.html`, sections in order:

1. **Hero (the card).** Two-panel layout like the physical card: cream left panel with an inline SVG watercolor-style rainbow with clouds, "BRIGHT HUES" in orange caps, "FACE PAINTING" below. Orange right panel with "EMRIE COOPER", the three-line tagline, and two large buttons: "Call or text" (`tel:+14353571166`) and "Email" (`mailto:brighthuesfacepaint@gmail.com`). On phones the panels stack vertically. Sticky-free; the buttons are simply near the top.
2. **Gallery.** Heading "Recent faces". A horizontally scrolling carousel with previous/next arrow buttons, native touch swipe via CSS scroll-snap, and dot indicators. Images come from `gallery.json`. When the list is empty, the carousel shows six placeholder tiles in the rainbow colors with a "Photos coming soon" label so the page still looks finished.
3. **About Emrie.** Short paragraph of placeholder copy marked clearly for replacement, with an optional portrait slot (`images/emrie.jpg`; hidden if the file is absent).
4. **What to expect.** Four short cards: event types (birthdays, school and church events, festivals, anything), skin-safe water-based paints that wash off with soap and water, roughly how long per face, and service area (placeholder "Utah County and nearby"). Copy is placeholder and easy to edit.
5. **Footer / contact.** Orange band repeating the phone and email as links, plus the business name.

## Files

```
brighthues/
  public/
    index.html
    styles.css
    gallery.js         # carousel + loads gallery.json
    gallery.json       # [{ "src": "images/gallery/x.jpg", "alt": "..." }]
    images/
      gallery/         # drop photos here
      .gitkeep
  wrangler.jsonc       # name "brighthues", assets directory "./public"
  package.json         # scripts: dev, deploy
  README.md            # how to add photos, edit text, deploy
  docs/superpowers/specs/...
```

## Gallery data flow

`gallery.js` fetches `gallery.json` on load. Each entry renders as an `<img loading="lazy">` slide. If fetch fails or the array is empty, it renders the placeholder tiles instead. Arrow buttons scroll the track by one slide width; dots are generated from the slide count and updated on scroll. No dependencies.

## Deploy

- `wrangler.jsonc`: `name: "brighthues"`, `compatibility_date` set to today, `assets: { directory: "./public" }`, no worker script (assets-only). SPA/404 handling left at defaults.
- `npm run dev` runs `wrangler dev`; `npm run deploy` runs `wrangler deploy`. Requires `wrangler login` once.

## Error handling

- Missing or malformed `gallery.json` falls back to placeholders and logs a console warning; the page never breaks.
- Missing `images/emrie.jpg` hides the portrait via the image `onerror` handler.

## Accessibility and performance

- Every image has alt text from `gallery.json`; placeholder tiles are `aria-hidden`.
- Carousel buttons are real `<button>` elements with labels; the track is keyboard scrollable.
- Color contrast: cream on orange and orange on cream both checked to meet WCAG AA at heading sizes; body text uses `ink` on cream.
- Single font family, lazy-loaded images, no JS beyond the carousel. Target: loads in well under a second on a phone.

## Testing

- `wrangler dev` locally; check at 400px and desktop widths in the browser.
- Verify `tel:` and `mailto:` links, carousel arrows and swipe, placeholder fallback with an empty `gallery.json`, and real images with a sample entry.
- `wrangler deploy` to the workers.dev subdomain and confirm it loads.

## Out of scope

Booking form, pricing, Instagram integration, custom domain, analytics.
