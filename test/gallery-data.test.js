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
