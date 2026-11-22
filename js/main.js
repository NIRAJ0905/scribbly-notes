import { store } from './state.js';
import { paginateNotes } from './paginator.js';
import { renderPreview } from './previewRenderer.js';
import { initUiControls } from './uiControls.js';

let currentPages = [];

function updateApp(state) {
  currentPages = paginateNotes(state.text, state.fontStyle, state.variation);

  const safePageIndex = Math.max(
    0,
    Math.min(state.currentPage, currentPages.length - 1)
  );
  if (safePageIndex !== state.currentPage) {
    state.currentPage = safePageIndex;
  }

  const stageEl = document.getElementById('previewStage');
  if (stageEl) {
    renderPreview(stageEl, currentPages, { ...state, currentPage: safePageIndex });
  }

  const trimmed = (state.text || '').trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;

  const wordCountEl = document.getElementById('wordCount');
  const pageCountMetaEl = document.getElementById('pageCountMeta');
  const pageIndicatorEl = document.getElementById('pageIndicator');
  const prevPageBtn = document.getElementById('prevPageBtn');
  const nextPageBtn = document.getElementById('nextPageBtn');

  if (wordCountEl) {
    wordCountEl.textContent = `${words} ${words === 1 ? 'word' : 'words'}`;
  }
  if (pageCountMetaEl) {
    pageCountMetaEl.textContent = `${currentPages.length} ${currentPages.length === 1 ? 'page' : 'pages'}`;
  }
  if (pageIndicatorEl) {
    pageIndicatorEl.textContent = `Page ${safePageIndex + 1} of ${currentPages.length}`;
  }
  if (prevPageBtn) {
    prevPageBtn.disabled = state.showAllPages || safePageIndex === 0;
  }
  if (nextPageBtn) {
    nextPageBtn.disabled = state.showAllPages || safePageIndex >= currentPages.length - 1;
  }
}

async function bootstrap() {
  initUiControls(() => currentPages);
  store.subscribe(updateApp);
  updateApp(store.getState());

  try {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
      updateApp(store.getState());
    }
  } catch (error) {
    console.warn('Local handwriting fonts could not be loaded; using browser fallbacks.', error);
  }

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker
      .register('./sw.js')
      .catch((error) => console.error('Offline support could not be enabled:', error));
  }
}

bootstrap();