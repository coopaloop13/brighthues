# Bright Hues Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a single-page static "website business card" for Bright Hues Face Painting on Cloudflare Workers static assets.

**Architecture:** One `public/index.html` with a stylesheet and two small ES modules: a pure `gallery-data.js` (unit tested with `node --test`) that decides what slides to show, and `gallery.js` that renders the carousel in the DOM. Wrangler serves `public/` as an assets-only Worker.

**Tech Stack:** Plain HTML/CSS/JS (ES modules, no bundler), Node 20+ built-in test runner, Wrangler 4.

**Spec:** `docs/superpowers/specs/2026-09-11-brighthues-website-design.md`

## Global Constraints

- No framework, no build step, no runtime dependencies. Only dev dependency is `wrangler`.
- Brand tokens exactly: cream `#FFEBB8`, orange `#FF6B1C`, orange-dark `#E55A0E`, ink `#3A2A1A`, rainbow `#F28B82 #F9B36A #F6E27A #A8D8A0 #8FC1E3 #B9A6E0`.
- Contact: phone `(435) 357-1166` as `tel:+14353571166`, email `brighthuesfacepaint@gmail.com` as `mailto:`.
- Text on orange panels is `ink`, except the large wordmark/name which is cream. Headings on cream are `orange-dark`.
- Page must work at 400px width with a 16px side gutter and never scroll horizontally.
- Worker name `brighthues`, assets directory `./public`, no `main` script.
- Commit after every task with the attribution trailer lines from the session.

---

### Task 1: Project scaffold and Wrangler config

**Files:**
- Create: `package.json`, `wrangler.jsonc`, `.gitignore`, `public/index.html` (minimal), `public/images/gallery/.gitkeep`

**Interfaces:**
- Produces: `npm run dev` (serves `public/` at http://localhost:8787), `npm run deploy`, `npm test` (runs `node --test test/`).

- [ ] **Step 1: Create package.json**

```json
{
  "name": "brighthues",
  "private": true,
  "version": "1.0.0",
  "description": "Bright Hues Face Painting website",
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "test": "node --test test/"
  },
  "devDependencies": {
    "wrangler": "^4.0.0"
  }
}
```

- [ ] **Step 2: Create wrangler.jsonc**

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "brighthues",
  "compatibility_date": "2026-09-11",
  "assets": {
    "directory": "./public"
  }
}
```

- [ ] **Step 3: Create .gitignore and placeholder page**

`.gitignore`:
```
node_modules/
.wrangler/
.DS_Store
```

`public/index.html`:
```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bright Hues Face Painting</title>
</head>
<body>
<h1>Bright Hues Face Painting</h1>
</body>
</html>
```

Create empty `public/images/gallery/.gitkeep`.

- [ ] **Step 4: Install and verify dev server**

Run: `npm install && (npx wrangler dev --port 8787 & sleep 6; curl -s http://localhost:8787 | head -5; kill %1)`
Expected: the HTML above is printed, containing `Bright Hues Face Painting`.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json wrangler.jsonc .gitignore public
git commit -m "Scaffold static-assets Worker for Bright Hues site"
```

---

### Task 2: Gallery data module (TDD)

**Files:**
- Create: `public/gallery-data.js`
- Test: `test/gallery-data.test.js`

**Interfaces:**
- Produces: `resolveSlides(data: unknown): Slide[]` where `Slide` is `{ kind: 'photo', src: string, alt: string }` or `{ kind: 'placeholder', color: string }`. Also exports `PLACEHOLDER_COLORS: string[]` (the six rainbow hexes) and `placeholders(): Slide[]`.

- [ ] **Step 1: Write the failing tests**

`test/gallery-data.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveSlides, placeholders, PLACEHOLDER_COLORS } from '../public/gallery-data.js';

test('valid entries become photo slides with alt text', () => {
  const slides = resolveSlides([
    { src: 'images/gallery/tiger.jpg', alt: 'Tiger face' },
    { src: 'images/gallery/butterfly.jpg' },
  ]);
  assert.deepEqual(slides, [
    { kind: 'photo', src: 'images/gallery/tiger.jpg', alt: 'Tiger face' },
    { kind: 'photo', src: 'images/gallery/butterfly.jpg', alt: '' },
  ]);
});

test('empty list falls back to six rainbow placeholders', () => {
  const slides = resolveSlides([]);
  assert.equal(slides.length, 6);
  assert.deepEqual(slides.map(s => s.color), PLACEHOLDER_COLORS);
  assert.ok(slides.every(s => s.kind === 'placeholder'));
});

test('non-array input (fetch failure) falls back to placeholders', () => {
  assert.deepEqual(resolveSlides(null), placeholders());
  assert.deepEqual(resolveSlides({ src: 'x.jpg' }), placeholders());
});

test('entries without a usable src are dropped', () => {
  const slides = resolveSlides([{ alt: 'no src' }, { src: '   ' }, null, { src: 'ok.jpg' }]);
  assert.deepEqual(slides, [{ kind: 'photo', src: 'ok.jpg', alt: '' }]);
});

test('placeholder colors are the six brand rainbow hexes', () => {
  assert.deepEqual(PLACEHOLDER_COLORS, ['#F28B82', '#F9B36A', '#F6E27A', '#A8D8A0', '#8FC1E3', '#B9A6E0']);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL, `Cannot find module '.../public/gallery-data.js'`.

- [ ] **Step 3: Implement the module**

`public/gallery-data.js`:
```js
// Decides which slides the carousel shows. Pure: no DOM, no fetch.
export const PLACEHOLDER_COLORS = ['#F28B82', '#F9B36A', '#F6E27A', '#A8D8A0', '#8FC1E3', '#B9A6E0'];

export function placeholders() {
  return PLACEHOLDER_COLORS.map(color => ({ kind: 'placeholder', color }));
}

export function resolveSlides(data) {
  if (!Array.isArray(data)) return placeholders();
  const photos = data
    .filter(entry => entry && typeof entry.src === 'string' && entry.src.trim() !== '')
    .map(entry => ({
      kind: 'photo',
      src: entry.src,
      alt: typeof entry.alt === 'string' ? entry.alt : '',
    }));
  return photos.length > 0 ? photos : placeholders();
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: 5 passing, 0 failing.

- [ ] **Step 5: Commit**

```bash
git add public/gallery-data.js test/gallery-data.test.js
git commit -m "Add gallery slide resolver with placeholder fallback"
```

---

### Task 3: Page markup and styles (hero, gallery shell, about, expect, footer)

**Files:**
- Modify: `public/index.html` (replace entirely)
- Create: `public/styles.css`, `public/gallery.json` (empty array)

**Interfaces:**
- Produces DOM hooks consumed by Task 4: `ul.carousel-track`, `div.carousel-dots`, `button.carousel-prev`, `button.carousel-next`. CSS custom property `--tile` on `.slide-placeholder` sets the tile color.

- [ ] **Step 1: Write index.html**

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bright Hues Face Painting | Emrie Cooper</title>
<meta name="description" content="Bright Hues Face Painting by Emrie Cooper. Birthday parties and any event. Call or text (435) 357-1166 to book.">
<meta name="theme-color" content="#FF6B1C">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="styles.css">
</head>
<body>

<header class="card">
  <div class="card-left">
    <svg class="rainbow" viewBox="0 0 300 175" role="img" aria-label="Watercolor rainbow with clouds">
      <g fill="none" stroke-linecap="round" stroke-width="22" opacity="0.9">
        <path d="M20 150 A130 130 0 0 1 280 150" stroke="#F28B82"/>
        <path d="M42 150 A108 108 0 0 1 258 150" stroke="#F9B36A"/>
        <path d="M64 150 A86 86 0 0 1 236 150" stroke="#F6E27A"/>
        <path d="M86 150 A64 64 0 0 1 214 150" stroke="#A8D8A0"/>
        <path d="M108 150 A42 42 0 0 1 192 150" stroke="#8FC1E3"/>
        <path d="M130 150 A20 20 0 0 1 170 150" stroke="#B9A6E0"/>
      </g>
      <g class="cloud" opacity="0.95">
        <ellipse cx="38" cy="150" rx="34" ry="18" fill="#E9E4F5"/>
        <ellipse cx="22" cy="140" rx="18" ry="16" fill="#D9DEF3"/>
        <ellipse cx="50" cy="136" rx="20" ry="18" fill="#F3D9E6"/>
        <ellipse cx="262" cy="150" rx="34" ry="18" fill="#E9E4F5"/>
        <ellipse cx="278" cy="140" rx="18" ry="16" fill="#D9DEF3"/>
        <ellipse cx="250" cy="136" rx="20" ry="18" fill="#F3D9E6"/>
      </g>
    </svg>
    <p class="wordmark">Bright Hues</p>
    <p class="wordmark-sub">Face Painting</p>
  </div>
  <div class="card-right">
    <h1 class="name">Emrie Cooper</h1>
    <p class="tagline">Birthday parties<br>Any event<br>Call to hire now!</p>
    <div class="cta">
      <a class="btn" href="tel:+14353571166">Call or text (435) 357-1166</a>
      <a class="btn btn-outline" href="mailto:brighthuesfacepaint@gmail.com">Email Emrie</a>
    </div>
  </div>
</header>

<main>
  <section class="gallery" aria-labelledby="gallery-heading">
    <h2 id="gallery-heading">Recent faces</h2>
    <div class="carousel">
      <button class="carousel-prev" type="button" aria-label="Previous photo">&#8249;</button>
      <ul class="carousel-track" aria-live="polite"></ul>
      <button class="carousel-next" type="button" aria-label="Next photo">&#8250;</button>
    </div>
    <div class="carousel-dots" role="tablist" aria-label="Choose photo"></div>
  </section>

  <section class="about" aria-labelledby="about-heading">
    <img class="portrait" src="images/emrie.jpg" alt="Emrie Cooper" onerror="this.remove()">
    <div>
      <h2 id="about-heading">Hi, I'm Emrie!</h2>
      <p>I love turning kids into tigers, butterflies, superheroes, and whatever else they can dream up. I bring my own table, supplies, and a big smile, so all you need to do is enjoy the party.</p>
      <p class="edit-note">(Replace this paragraph with Emrie's own words.)</p>
    </div>
  </section>

  <section class="expect" aria-labelledby="expect-heading">
    <h2 id="expect-heading">What to expect</h2>
    <ul class="expect-grid">
      <li><span class="expect-icon" style="--tile:#F28B82">&#127874;</span><h3>Any event</h3><p>Birthday parties, school and church events, festivals, neighborhood get-togethers.</p></li>
      <li><span class="expect-icon" style="--tile:#A8D8A0">&#10024;</span><h3>Skin-safe paints</h3><p>Professional water-based face paints that wash off with soap and water.</p></li>
      <li><span class="expect-icon" style="--tile:#8FC1E3">&#9201;</span><h3>Quick and fun</h3><p>Most designs take about five minutes per face, so everyone gets a turn.</p></li>
      <li><span class="expect-icon" style="--tile:#B9A6E0">&#128205;</span><h3>Local</h3><p>Serving Utah County and nearby. Ask about travel for other areas.</p></li>
    </ul>
  </section>
</main>

<footer class="contact">
  <p class="footer-name">Bright Hues Face Painting</p>
  <p><a href="tel:+14353571166">(435) 357-1166</a></p>
  <p><a href="mailto:brighthuesfacepaint@gmail.com">brighthuesfacepaint@gmail.com</a></p>
</footer>

<script type="module" src="gallery.js"></script>
</body>
</html>
```

- [ ] **Step 2: Write styles.css**

```css
:root {
  --cream: #FFEBB8;
  --orange: #FF6B1C;
  --orange-dark: #E55A0E;
  --ink: #3A2A1A;
  --font: 'Poppins', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --gutter: 16px;
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  font-family: var(--font);
  background: var(--cream);
  color: var(--ink);
  line-height: 1.5;
  overflow-x: hidden;
}
img { max-width: 100%; display: block; }
h1, h2, h3 { line-height: 1.1; margin: 0 0 0.5em; }
h2 { color: var(--orange-dark); font-size: clamp(1.6rem, 4vw, 2.2rem); font-weight: 800; text-transform: uppercase; letter-spacing: 0.02em; }

/* Hero card */
.card { display: grid; grid-template-columns: 1fr; min-height: 60vh; }
.card-left, .card-right { padding: clamp(2rem, 6vw, 4rem) var(--gutter); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.card-left { background: var(--cream); }
.card-right { background: var(--orange); color: var(--ink); }
.rainbow { width: min(320px, 80vw); height: auto; }
.wordmark { margin: 0.5rem 0 0; color: var(--orange); font-weight: 800; font-size: clamp(2rem, 6vw, 3rem); text-transform: uppercase; letter-spacing: 0.02em; }
.wordmark-sub { margin: 0; color: var(--orange); font-weight: 400; font-size: clamp(1.1rem, 3vw, 1.5rem); text-transform: uppercase; letter-spacing: 0.2em; }
.name { color: var(--cream); font-weight: 800; font-size: clamp(2rem, 6vw, 3.2rem); text-transform: uppercase; }
.tagline { margin: 0 0 1.5rem; font-weight: 600; font-size: clamp(1.1rem, 2.5vw, 1.4rem); text-transform: uppercase; letter-spacing: 0.05em; }
.cta { display: flex; flex-direction: column; gap: 0.75rem; width: 100%; max-width: 360px; }
.btn { display: block; padding: 0.9rem 1.2rem; border-radius: 999px; background: var(--cream); color: var(--ink); font-weight: 600; text-decoration: none; border: 3px solid var(--cream); transition: transform 0.15s; }
.btn:hover, .btn:focus-visible { transform: translateY(-2px); background: #fff3d1; }
.btn-outline { background: transparent; color: var(--ink); }
.btn-outline:hover, .btn-outline:focus-visible { background: rgba(255, 235, 184, 0.25); }

@media (min-width: 720px) {
  .card { grid-template-columns: 1fr 1fr; }
}

/* Sections */
main { padding: 0 var(--gutter); max-width: 1100px; margin: 0 auto; }
section { padding-block: clamp(2.5rem, 6vw, 4rem); }
section + section { border-top: 4px dotted rgba(255, 107, 28, 0.35); }

/* Gallery / carousel */
.carousel { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 0.5rem; }
.carousel-track { list-style: none; margin: 0; padding: 0; display: flex; gap: 1rem; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
.carousel-track::-webkit-scrollbar { display: none; }
.slide { flex: 0 0 min(80%, 340px); aspect-ratio: 4 / 5; scroll-snap-align: center; border-radius: 1.25rem; overflow: hidden; background: #fff; box-shadow: 0 6px 20px rgba(58, 42, 26, 0.12); }
.slide img { width: 100%; height: 100%; object-fit: cover; }
.slide-placeholder { display: grid; place-items: center; background: var(--tile); color: var(--ink); font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; font-size: 0.9rem; }
.carousel-prev, .carousel-next { width: 44px; height: 44px; border-radius: 50%; border: none; background: var(--orange); color: var(--cream); font-size: 1.8rem; line-height: 1; cursor: pointer; }
.carousel-prev:hover, .carousel-next:hover { background: var(--orange-dark); }
.carousel-dots { display: flex; justify-content: center; gap: 0.5rem; margin-top: 1rem; }
.carousel-dots button { width: 12px; height: 12px; border-radius: 50%; border: none; background: rgba(255, 107, 28, 0.35); cursor: pointer; padding: 0; }
.carousel-dots button[aria-selected="true"] { background: var(--orange); }

/* About */
.about { display: grid; grid-template-columns: 1fr; gap: 1.5rem; align-items: center; }
.portrait { width: min(240px, 60vw); aspect-ratio: 1; object-fit: cover; border-radius: 50%; border: 6px solid var(--orange); justify-self: center; }
.edit-note { font-size: 0.85rem; opacity: 0.6; }
@media (min-width: 720px) { .about { grid-template-columns: auto 1fr; gap: 3rem; } }

/* What to expect */
.expect-grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; }
.expect-grid li { background: #fff7e0; border-radius: 1.25rem; padding: 1.5rem; box-shadow: 0 4px 14px rgba(58, 42, 26, 0.08); }
.expect-grid h3 { color: var(--orange-dark); font-size: 1.2rem; }
.expect-grid p { margin: 0; }
.expect-icon { display: grid; place-items: center; width: 56px; height: 56px; border-radius: 50%; background: var(--tile); font-size: 1.6rem; margin-bottom: 0.75rem; }

/* Footer */
.contact { background: var(--orange); color: var(--ink); text-align: center; padding: 2.5rem var(--gutter); }
.contact p { margin: 0.25rem 0; }
.footer-name { color: var(--cream); font-weight: 800; text-transform: uppercase; font-size: 1.3rem; margin-bottom: 0.75rem; }
.contact a { color: var(--ink); font-weight: 600; text-decoration: none; }
.contact a:hover { text-decoration: underline; }
```

- [ ] **Step 3: Create empty gallery.json**

`public/gallery.json`:
```json
[]
```

- [ ] **Step 4: Verify in browser**

Run: `npm run dev` then open http://localhost:8787 in Chrome (claude-in-chrome tools). Check: hero shows rainbow, wordmark, name, two buttons; at 400px width the panels stack and nothing scrolls horizontally; at 1200px the panels sit side by side. The gallery area is empty for now (Task 4 fills it).

- [ ] **Step 5: Commit**

```bash
git add public/index.html public/styles.css public/gallery.json
git commit -m "Add page markup and brand styles"
```

---

### Task 4: Carousel behavior

**Files:**
- Create: `public/gallery.js`

**Interfaces:**
- Consumes: `resolveSlides` from `./gallery-data.js`; DOM hooks from Task 3.

- [ ] **Step 1: Write gallery.js**

```js
import { resolveSlides } from './gallery-data.js';

const track = document.querySelector('.carousel-track');
const dots = document.querySelector('.carousel-dots');
const prevBtn = document.querySelector('.carousel-prev');
const nextBtn = document.querySelector('.carousel-next');

async function loadGalleryData() {
  try {
    const res = await fetch('gallery.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('gallery.json unavailable, showing placeholder tiles:', err.message);
    return null;
  }
}

function slideElement(slide) {
  const li = document.createElement('li');
  li.className = 'slide';
  if (slide.kind === 'photo') {
    const img = document.createElement('img');
    img.src = slide.src;
    img.alt = slide.alt;
    img.loading = 'lazy';
    li.append(img);
  } else {
    li.classList.add('slide-placeholder');
    li.style.setProperty('--tile', slide.color);
    li.setAttribute('aria-hidden', 'true');
    li.textContent = 'Photos coming soon';
  }
  return li;
}

function slideWidth() {
  const first = track.firstElementChild;
  if (!first) return 0;
  const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
  return first.getBoundingClientRect().width + gap;
}

function currentIndex() {
  const w = slideWidth();
  return w ? Math.round(track.scrollLeft / w) : 0;
}

function scrollToIndex(i) {
  track.scrollTo({ left: i * slideWidth(), behavior: 'smooth' });
}

function renderDots(count) {
  dots.replaceChildren(...Array.from({ length: count }, (_, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-label', `Photo ${i + 1} of ${count}`);
    b.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    b.addEventListener('click', () => scrollToIndex(i));
    return b;
  }));
}

function updateDots() {
  const i = currentIndex();
  dots.querySelectorAll('button').forEach((b, j) => b.setAttribute('aria-selected', i === j ? 'true' : 'false'));
}

function render(slides) {
  track.replaceChildren(...slides.map(slideElement));
  renderDots(slides.length);
}

prevBtn.addEventListener('click', () => scrollToIndex(Math.max(0, currentIndex() - 1)));
nextBtn.addEventListener('click', () => scrollToIndex(Math.min(track.children.length - 1, currentIndex() + 1)));
track.addEventListener('scroll', () => requestAnimationFrame(updateDots), { passive: true });

render(resolveSlides(await loadGalleryData()));
```

- [ ] **Step 2: Verify placeholder fallback in browser**

With `gallery.json` still `[]`, reload http://localhost:8787. Expected: six pastel tiles reading "Photos coming soon", six dots, arrows move the track one tile at a time and the active dot follows.

- [ ] **Step 3: Verify real images**

Temporarily set `public/gallery.json` to:
```json
[
  { "src": "https://picsum.photos/seed/tiger/400/500", "alt": "Sample photo" },
  { "src": "https://picsum.photos/seed/bfly/400/500", "alt": "Sample photo 2" }
]
```
Reload. Expected: two image slides and two dots. Then restore `gallery.json` to `[]`.

- [ ] **Step 4: Run unit tests still pass**

Run: `npm test`
Expected: 5 passing.

- [ ] **Step 5: Commit**

```bash
git add public/gallery.js public/gallery.json
git commit -m "Add carousel with swipe, arrows, dots, and placeholder fallback"
```

---

### Task 5: README and deploy

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write README.md**

````markdown
# Bright Hues Face Painting

Single-page website for Emrie's face painting business, hosted on Cloudflare Workers.

## Run it locally

```bash
npm install
npm run dev
```
Open http://localhost:8787.

## Add photos

1. Copy the photo into `public/images/gallery/` (JPG or PNG, portrait orientation looks best, keep each under ~500 KB).
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

Everything is in `public/index.html`. Search for the paragraph you want to change and edit it. Phone and email appear in three places (hero buttons, footer); search for `357-1166` and `brighthuesfacepaint` to find them all.

## Deploy to Cloudflare

First time only:
```bash
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
````

- [ ] **Step 2: Final browser check**

Run `npm run dev`, open the page, and confirm at 400px and 1200px widths: hero, six placeholder tiles, about, four expect cards, footer. Click the call and email buttons and confirm the hrefs are `tel:+14353571166` and `mailto:brighthuesfacepaint@gmail.com`.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "Add README with photo, editing, and deploy instructions"
```

- [ ] **Step 4: Deploy (requires the user's Cloudflare login)**

Run: `npx wrangler whoami`. If not logged in, stop and ask the user to run `npx wrangler login`. Otherwise run `npm run deploy` and report the URL.
