import { DEFAULT_SAMPLE, store } from './state.js';
import { exportPageAsPng } from './canvasExporter.js';
import { exportAllPagesAsPdf } from './pdfExporter.js';

let toastTimer;

function requireElement(id) {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Required application element #${id} was not found.`);
  }
  return element;
}

export function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2600);
}

export function initUiControls(getPages) {
  const notesInput = requireElement('notesInput');
  const loadSampleBtn = requireElement('loadSampleBtn');
  const variationRange = requireElement('variationRange');
  const variationValue = requireElement('variationValue');
  const prevPageBtn = requireElement('prevPageBtn');
  const nextPageBtn = requireElement('nextPageBtn');
  const showAllPagesToggle = requireElement('showAllPagesToggle');
  const exportPageBtn = requireElement('exportPageBtn');
  const exportPdfBtn = requireElement('exportPdfBtn');

  const initial = store.getState();
  notesInput.value = initial.text;
  variationRange.value = String(initial.variation);
  variationValue.textContent = formatVariationLabel(initial.variation);
  syncActiveButtons(initial);

  let inputTimer;
  notesInput.addEventListener('input', () => {
    clearTimeout(inputTimer);
    inputTimer = setTimeout(() => {
      store.setState({ text: notesInput.value });
    }, 60);
  });

  loadSampleBtn.addEventListener('click', () => {
    notesInput.value = DEFAULT_SAMPLE;
    store.setState({ text: DEFAULT_SAMPLE, currentPage: 0 });
    showToast('Sample study notes loaded');
  });

  document.querySelectorAll('.style-card').forEach((button) => {
    button.addEventListener('click', () => {
      store.setState({ fontStyle: button.dataset.font });
      syncActiveButtons(store.getState());
    });
  });

  document.querySelectorAll('.ink-swatch').forEach((button) => {
    button.addEventListener('click', () => {
      store.setState({ inkColor: button.dataset.ink });
      syncActiveButtons(store.getState());
    });
  });

  document.querySelectorAll('.segment-btn').forEach((button) => {
    button.addEventListener('click', () => {
      store.setState({ paperStyle: button.dataset.paper });
      syncActiveButtons(store.getState());
    });
  });

  variationRange.addEventListener('input', () => {
    const variation = Number(variationRange.value);
    variationValue.textContent = formatVariationLabel(variation);
    store.setState({ variation });
  });

  prevPageBtn.addEventListener('click', () => {
    const { currentPage } = store.getState();
    if (currentPage > 0) {
      store.setState({ currentPage: currentPage - 1 });
    }
  });

  nextPageBtn.addEventListener('click', () => {
    const { currentPage } = store.getState();
    if (currentPage < getPages().length - 1) {
      store.setState({ currentPage: currentPage + 1 });
    }
  });

  showAllPagesToggle.addEventListener('change', () => {
    store.setState({ showAllPages: showAllPagesToggle.checked });
  });

  exportPageBtn.addEventListener('click', async () => {
    const pages = getPages();
    const state = store.getState();
    const pageIndex = Math.min(state.currentPage, pages.length - 1);

    try {
      await exportPageAsPng(pages[pageIndex], pages.length, state);
      showToast(`Exported Page ${pageIndex + 1} as PNG`);
    } catch (error) {
      console.error('PNG export failed:', error);
      showToast('PNG export failed. Please try again.');
    }
  });

  exportPdfBtn.addEventListener('click', async () => {
    const pages = getPages();
    const state = store.getState();
    exportPdfBtn.disabled = true;
    exportPdfBtn.textContent = 'Building PDF...';

    try {
      await exportAllPagesAsPdf(pages, state);
      showToast(`Exported ${pages.length}-page PDF notebook`);
    } catch (error) {
      console.error('PDF export failed:', error);
      showToast('PDF export failed. Please try again.');
    } finally {
      exportPdfBtn.disabled = false;
      exportPdfBtn.textContent = 'Export All Pages (PDF)';
    }
  });
}

function formatVariationLabel(value) {
  if (value === 0) return 'None (0%)';
  if (value <= 35) return `Subtle (${value}%)`;
  if (value <= 75) return `Medium (${value}%)`;
  return `Expressive (${value}%)`;
}

function syncActiveButtons(state) {
  document.querySelectorAll('.style-card').forEach((button) => {
    button.classList.toggle('active', button.dataset.font === state.fontStyle);
  });
  document.querySelectorAll('.ink-swatch').forEach((button) => {
    button.classList.toggle('active', button.dataset.ink === state.inkColor);
  });
  document.querySelectorAll('.segment-btn').forEach((button) => {
    button.classList.toggle('active', button.dataset.paper === state.paperStyle);
  });
}
