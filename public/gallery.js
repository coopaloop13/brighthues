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
  const caption = document.createElement('p');
  caption.className = 'slide-caption';
  if (slide.kind === 'photo') {
    const img = document.createElement('img');
    img.src = slide.src;
    img.alt = slide.alt;
    img.loading = 'lazy';
    caption.textContent = slide.caption;
    li.append(img, caption);
  } else {
    li.classList.add('slide-placeholder');
    li.style.setProperty('--tile', slide.color);
    li.setAttribute('aria-hidden', 'true');
    const photo = document.createElement('div');
    photo.className = 'slide-photo';
    photo.textContent = 'photo';
    caption.textContent = 'coming soon';
    li.append(photo, caption);
  }
  return li;
}

function slideWidth() {
  const first = track.firstElementChild;
  if (!first) return 0;
  const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
  return first.getBoundingClientRect().width + gap;
}

// Index used for arrow navigation: nearest slide to the left edge.
function rawIndex() {
  const w = slideWidth();
  return w ? Math.round(track.scrollLeft / w) : 0;
}

// Index shown as active in the dots: when scrolled to the very end,
// the last slide counts as current even if it is not at the left edge.
function currentIndex() {
  const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
  return atEnd ? track.children.length - 1 : rawIndex();
}

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function scrollToIndex(i) {
  track.scrollTo({ left: i * slideWidth(), behavior: reducedMotion.matches ? 'auto' : 'smooth' });
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

prevBtn.addEventListener('click', () => scrollToIndex(Math.max(0, rawIndex() - 1)));
nextBtn.addEventListener('click', () => scrollToIndex(Math.min(track.children.length - 1, rawIndex() + 1)));
track.addEventListener('scroll', updateDots, { passive: true });

render(resolveSlides(await loadGalleryData()));
