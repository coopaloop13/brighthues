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
