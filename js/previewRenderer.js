import { FONT_CONFIGS } from './state.js';

const NO_JITTER = { dx: 0, dy: 0, rotateDeg: 0, scale: 1 };

export function renderPreview(stageEl, pages, state) {
  const fontConfig = FONT_CONFIGS[state.fontStyle] || FONT_CONFIGS['style-one'];
  const pageIndex = Math.max(0, Math.min(state.currentPage, pages.length - 1));
  const pagesToRender = state.showAllPages ? pages : [pages[pageIndex]].filter(Boolean);
  const fragment = document.createDocumentFragment();

  pagesToRender.forEach((page) => {
    const sheet = document.createElement('article');
    sheet.className = `notebook-sheet paper-${state.paperStyle} ${fontConfig.cssClass}`;
    sheet.style.color = state.inkColor;
    sheet.style.fontSize = `${fontConfig.baseSize}px`;
    sheet.setAttribute('aria-label', `Notebook page ${page.pageNumber} of ${pages.length}`);

    const linesContainer = document.createElement('div');
    linesContainer.className = 'sheet-lines';

    page.lines.forEach((line) => {
      const lineEl = document.createElement('div');
      lineEl.className = 'handwritten-line';

      line.words.forEach((word) => {
        const wordEl = document.createElement('span');
        wordEl.className = 'handwritten-word';
        wordEl.textContent = word.text;

        if (!word.isSpace) {
          const { dx, dy, rotateDeg, scale } = word.jitter || NO_JITTER;
          wordEl.style.transform =
            `translate(${dx}px, ${dy}px) rotate(${rotateDeg}deg) scale(${scale})`;
        }

        lineEl.appendChild(wordEl);
      });

      linesContainer.appendChild(lineEl);
    });

    const footer = document.createElement('div');
    footer.className = 'sheet-footer';
    footer.textContent = `Page ${page.pageNumber} / ${pages.length}`;

    sheet.append(linesContainer, footer);
    fragment.appendChild(sheet);
  });

  stageEl.replaceChildren(fragment);
}
