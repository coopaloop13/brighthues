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
     { "src": "images/gallery/tiger.jpg", "alt": "Tiger face paint on a smiling kid", "caption": "Luna the tiger" },
     { "src": "images/gallery/butterfly.jpg", "alt": "Butterfly face paint", "caption": "Butterfly, age 5" }
   ]
   ```
   `caption` is the handwritten label under the polaroid. `alt` describes the photo for screen readers and search engines. If you leave out `caption`, the `alt` text is used.
3. Deploy (below).

If `gallery.json` is empty, the site shows blank "coming soon" polaroids.

## Edit the text

Everything is in `public/index.html`: the intro sticker, the look names, the three fact stickers, and the footer. Search for the words you want to change and edit them. The email address appears in the hero button, the footer, and the page description; search for `brighthuesfacepaint` to find them all. The phone number is deliberately left off the site.

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
The site is live at https://brighthues.site (and www.brighthues.site). The custom domains are configured in `wrangler.jsonc` under `routes`, so a deploy keeps them attached. The workers.dev address is switched off once custom domains exist.

## Tests

```bash
npm test
```
