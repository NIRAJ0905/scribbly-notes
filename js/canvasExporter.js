import { FONT_CONFIGS, PAGE_METRICS } from './state.js';

function getFontConfig(fontStyle) {
  return FONT_CONFIGS[fontStyle] || FONT_CONFIGS['style-one'];
}

function drawPaper(ctx, paperStyle) {
  ctx.fillStyle = '#fffdf8';
  ctx.fillRect(0, 0, PAGE_METRICS.width, PAGE_METRICS.height);

  if (paperStyle === 'lined') {
    ctx.strokeStyle = '#c7d9ec';
    ctx.lineWidth = 1;
    for (
      let y = PAGE_METRICS.paddingTop + PAGE_METRICS.lineHeight;
      y <= PAGE_METRICS.height - PAGE_METRICS.paddingBottom;
      y += PAGE_METRICS.lineHeight
    ) {
      ctx.beginPath();
      ctx.moveTo(0, y - 0.5);
      ctx.lineTo(PAGE_METRICS.width, y - 0.5);
      ctx.stroke();
    }

    ctx.strokeStyle = '#e69aa0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(67, 0);
    ctx.lineTo(67, PAGE_METRICS.height);
    ctx.stroke();
  } else if (paperStyle === 'grid') {
    ctx.strokeStyle = '#d4e1ed';
    ctx.lineWidth = 1;

    for (
      let x = PAGE_METRICS.paddingLeft;
      x < PAGE_METRICS.width;
      x += PAGE_METRICS.gridSize
    ) {
      ctx.beginPath();
      ctx.moveTo(x - 0.5, 0);
      ctx.lineTo(x - 0.5, PAGE_METRICS.height);
      ctx.stroke();
    }

    for (
      let y = PAGE_METRICS.paddingTop;
      y < PAGE_METRICS.height;
      y += PAGE_METRICS.gridSize
    ) {
      ctx.beginPath();
      ctx.moveTo(0, y - 0.5);
      ctx.lineTo(PAGE_METRICS.width, y - 0.5);
      ctx.stroke();
    }
  }
}

export function renderPageToCanvas(page, totalPages, state, scaleFactor = 2) {
  if (!Number.isFinite(scaleFactor) || scaleFactor <= 0) {
    throw new RangeError('Canvas scale factor must be a positive number.');
  }

  const fontConfig = getFontConfig(state.fontStyle);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(PAGE_METRICS.width * scaleFactor);
  canvas.height = Math.round(PAGE_METRICS.height * scaleFactor);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('This browser could not create a 2D canvas context.');
  }

  ctx.scale(scaleFactor, scaleFactor);
  drawPaper(ctx, state.paperStyle);

  ctx.fillStyle = state.inkColor;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'center';

  page.lines.forEach((line, lineIndex) => {
    let cursorX = PAGE_METRICS.paddingLeft;
    const baselineY =
      PAGE_METRICS.paddingTop +
      lineIndex * PAGE_METRICS.lineHeight +
      fontConfig.baselineOffset;

    line.words.forEach((word) => {
      const jitter = word.jitter || { dx: 0, dy: 0, rotateDeg: 0, scale: 1 };
      const wordWidth = word.width || 0;

      if (!word.isSpace) {
        ctx.font = `${fontConfig.baseSize * jitter.scale}px ${fontConfig.canvasFont}`;
        ctx.save();
        ctx.translate(cursorX + wordWidth / 2 + jitter.dx, baselineY + jitter.dy);
        ctx.rotate((jitter.rotateDeg * Math.PI) / 180);
        ctx.fillText(word.text, 0, 0);
        ctx.restore();
      }

      cursorX += wordWidth;
    });
  });

  ctx.fillStyle = '#8b939e';
  ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(
    `Page ${page.pageNumber} / ${totalPages}`,
    PAGE_METRICS.width - 36,
    PAGE_METRICS.height - 22
  );

  return canvas;
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('The browser could not encode the page image.'));
      }
    }, 'image/png');
  });
}

export async function exportPageAsPng(page, totalPages, state) {
  const canvas = renderPageToCanvas(page, totalPages, state, 2);
  const blob = await canvasToBlob(canvas);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `scribbly-notes-page-${page.pageNumber}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}