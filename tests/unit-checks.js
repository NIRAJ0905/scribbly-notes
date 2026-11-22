import { getWordJitter } from '../js/jitter.js';
import { paginateNotes } from '../js/paginator.js';
import { PAGE_METRICS } from '../js/state.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

export function runUnitChecks() {
  const results = [];

  for (let index = 0; index < 200; index += 1) {
    const jitter = getWordJitter(`word${index}`, index % 20, index, 100);
    assert(
      Math.abs(jitter.dy) <= 1.6 &&
        Math.abs(jitter.rotateDeg) <= 1.35 &&
        jitter.scale >= 0.965 &&
        jitter.scale <= 1.035,
      `Jitter exceeded its configured readability bounds: ${JSON.stringify(jitter)}`
    );
  }

  const noVariation = getWordJitter('steady', 0, 0, 0);
  assert(
    noVariation.dx === 0 &&
      noVariation.dy === 0 &&
      noVariation.rotateDeg === 0 &&
      noVariation.scale === 1,
    'Zero variation should not alter word positioning or size.'
  );
  results.push('PASS: Handwriting variation stays within readability bounds.');

  const usableHeight =
    PAGE_METRICS.height - PAGE_METRICS.paddingTop - PAGE_METRICS.paddingBottom;
  const maxLines = Math.floor(usableHeight / PAGE_METRICS.lineHeight);
  const longText = Array.from(
    { length: maxLines + 12 },
    (_, index) => `Line number ${index + 1}`
  ).join('\n');
  const pages = paginateNotes(longText, 'style-one', 60);

  assert(pages.length > 1, 'Expected long notes to create multiple pages.');
  pages.forEach((page) => {
    assert(
      page.lines.length <= maxLines,
      `Page ${page.pageNumber} exceeded the whole-line limit.`
    );
  });
  assert(
    pages.reduce((count, page) => count + page.lines.length, 0) === maxLines + 12,
    'Pagination should preserve every complete input line.'
  );
  results.push('PASS: Pagination keeps complete lines within each page.');

  const usableWidth =
    PAGE_METRICS.width - PAGE_METRICS.paddingLeft - PAGE_METRICS.paddingRight;
  const wrapped = paginateNotes('W'.repeat(100), 'style-one', 0);
  wrapped.forEach((page) =>
    page.lines.forEach((line) =>
      line.words.forEach((word) => {
        assert(word.width <= usableWidth, 'A wrapped word exceeded the page width.');
      })
    )
  );
  results.push('PASS: Long unbroken words wrap to fit the printable page width.');

  return results;
}