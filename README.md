# Bright Hues Face Painting

Single-page website for Emrie's face painting business, hosted on Cloudflare Workers.

## Run it locally

```bash
npm install
npm run dev
```
Open http://localhost:8787.

## Add photos

1. Copy the photo into `public/images/gallery/` (JPG or PNG, portrait orientation looks best, keep each under about 500 KB).
2. Add a line to `public/gallery.json`:
   ```json
   [
     { "src": "images/gallery/tiger.jpg", "alt": "Tiger face paint" },
     { "src": "images/gallery/butterfly.jpg", "alt": "Butterfly face paint" }
   ]
   ```
   The `alt` text describes the photo for screen readers and search engines.
3. Deploy (below).

If `gallery.json` is empty, the site shows "Photos coming soon" tiles.

## Add a photo of Emrie

Save it as `public/images/emrie.jpg`. It appears automatically in the About section. If the file is missing, the section just shows text.

## Edit the text

Everything is in `public/index.html`. Search for the paragraph you want to change and edit it. The email address appears in the hero button, the footer, and the page description; search for `brighthuesfacepaint` to find them all. The phone number is deliberately left off the site.

## Deploy to Cloudflare

This project deploys to the joshuarcooper@gmail.com Cloudflare account only. Check which account is active first:

```bash
npx wrangler whoami
```

First time only (or if the wrong account shows):
```bash
npx wrangler logout
npx wrangler login
```
Then every time:
```bash
npm run deploy
```
Wrangler prints the live URL (something like `https://brighthues.<account>.workers.dev`). To attach a real domain later, open the Worker in the Cloudflare dashboard, go to Settings, then Domains & Routes.

## Tests

```bash
npm test
```
