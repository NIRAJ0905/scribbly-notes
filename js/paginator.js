import { FONT_CONFIGS, PAGE_METRICS } from './state.js';
import { getWordJitter } from './jitter.js';

let measureCanvas = null;

function getMeasureContext(fontConfig) {
  if (!measureCanvas) {
    measureCanvas = document.createElement('canvas');
  }
  const ctx = measureCanvas.getContext('2d');
  ctx.font = `${fontConfig.baseSize}px ${fontConfig.canvasFont}`;
  return ctx;
}

/**
 * Splits text into wrapped visual lines first, then groups complete lines
 * onto pages so no line is ever sliced in half across a page boundary.
 */
export function paginateNotes(text, fontStyleKey, variationPercent) {
  const fontConfig = FONT_CONFIGS[fontStyleKey] || FONT_CONFIGS['style-one'];
  const ctx = getMeasureContext(fontConfig);

  const usableWidth =
    PAGE_METRICS.width - PAGE_METRICS.paddingLeft - PAGE_METRICS.paddingRight;
  const usableHeight =
    PAGE_METRICS.height - PAGE_METRICS.paddingTop - PAGE_METRICS.paddingBottom;
  const maxLinesPerPage = Math.max(1, Math.floor(usableHeight / PAGE_METRICS.lineHeight));

  const rawParagraphs = (text || '').replace(/\r\n/g, '\n').split('\n');
  const allLines = [];

  rawParagraphs.forEach((paragraph) => {
    if (paragraph.trim() === '') {
      allLines.push({ words: [] });
      return;
    }

    // Preserve leading spaces/indentation as tokens if present
    const tokens = paragraph.match(/(\s+|\S+)/g) || [];
    let currentLineWords = [];
    let currentLineWidth = 0;

    for (const token of tokens) {
      const isSpace = /^\s+$/.test(token);
      if (isSpace && currentLineWords.length === 0) {
        // Keep intentional indentation at start of paragraph
        const indentWidth = ctx.measureText(token).width;
        if (indentWidth < usableWidth * 0.5) {
          currentLineWords.push({ text: token, width: indentWidth, isSpace: true });
          currentLineWidth += indentWidth;
        }
        continue;
      }

      const tokenWidth = ctx.measureText(token).width;

      // Handle extraordinarily long single words gracefully
      if (!isSpace && tokenWidth > usableWidth) {
        if (currentLineWords.length > 0) {
          allLines.push({ words: currentLineWords });
          currentLineWords = [];
          currentLineWidth = 0;
        }
        let chunk = '';
        for (const ch of token) {
          const testChunk = chunk + ch;
          if (ctx.measureText(testChunk).width > usableWidth && chunk.length > 0) {
            allLines.push({
              words: [{ text: chunk, width: ctx.measureText(chunk).width, isSpace: false }]
            });
            chunk = ch;
          } else {
            chunk = testChunk;
          }
        }
        if (chunk) {
          const w = ctx.measureText(chunk).width;
          currentLineWords.push({ text: chunk, width: w, isSpace: false });
          currentLineWidth = w;
        }
        continue;
      }

      if (currentLineWidth + tokenWidth > usableWidth && currentLineWords.length > 0) {
        // Trim trailing whitespace before breaking line
        while (
          currentLineWords.length > 0 &&
          currentLineWords[currentLineWords.length - 1].isSpace
        ) {
          currentLineWords.pop();
        }
        allLines.push({ words: currentLineWords });
        currentLineWords = [];
        currentLineWidth = 0;

        if (isSpace) continue;
      }

      currentLineWords.push({ text: token, width: tokenWidth, isSpace });
      currentLineWidth += tokenWidth;
    }

    if (currentLineWords.length > 0) {
      allLines.push({ words: currentLineWords });
    }
  });

  if (allLines.length === 0) {
    allLines.push({ words: [] });
  }

  // Attach deterministic jitter per word and group complete lines into pages
  const pages = [];
  for (let i = 0; i < allLines.length; i += maxLinesPerPage) {
    const pageSlice = allLines.slice(i, i + maxLinesPerPage).map((line, localLineIdx) => {
      const globalLineIdx = i + localLineIdx;
      const enrichedWords = line.words.map((w, wordIdx) => ({
        ...w,
        jitter: w.isSpace
          ? { dx: 0, dy: 0, rotateDeg: 0, scale: 1 }
          : getWordJitter(w.text, globalLineIdx, wordIdx, variationPercent)
      }));
      return { words: enrichedWords };
    });

    pages.push({
      pageNumber: pages.length + 1,
      lines: pageSlice
    });
  }

  return pages;
}