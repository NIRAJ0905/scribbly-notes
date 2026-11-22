const STORAGE_KEY = 'scribbly_notes_state_v1';

export const FONT_CONFIGS = {
  'style-one': {
    id: 'style-one',
    label: 'Neat Script',
    cssClass: 'font-style-one',
    canvasFont: "'ScribblyStyleOne', 'Segoe Print', 'Bradley Hand', cursive",
    baseSize: 22,
    baselineOffset: 24
  },
  'style-two': {
    id: 'style-two',
    label: 'Lecture Flow',
    cssClass: 'font-style-two',
    canvasFont: "'ScribblyStyleTwo', 'Caveat', 'Comic Sans MS', cursive",
    baseSize: 23,
    baselineOffset: 24
  },
  'style-three': {
    id: 'style-three',
    label: 'Quick Margin',
    cssClass: 'font-style-three',
    canvasFont: "'ScribblyStyleThree', 'Chalkboard SE', 'Gabriola', cursive",
    baseSize: 21,
    baselineOffset: 24
  }
};

export const PAGE_METRICS = {
  width: 720,
  height: 1018,
  paddingTop: 72,
  paddingBottom: 64,
  paddingLeft: 84,
  paddingRight: 48,
  lineHeight: 34,
  gridSize: 24
};

const DEFAULT_SAMPLE = `Biology 101 — Cellular Respiration Notes

1. Glycolysis (Cytoplasm)
- Breaks down one 6-carbon glucose molecule into two 3-carbon pyruvate molecules.
- Net yield: 2 ATP and 2 NADH per glucose molecule.
- Anaerobic process: does not require oxygen to proceed.

2. Citric Acid Cycle / Krebs Cycle (Mitochondrial Matrix)
- Pyruvate is oxidized into Acetyl-CoA before entering the cycle.
- Releases CO2 as a metabolic byproduct while generating high-energy electron carriers (NADH and FADH2).

3. Oxidative Phosphorylation (Inner Mitochondrial Membrane)
- Electron Transport Chain pumps protons across the cristae to build an electrochemical gradient.
- ATP Synthase uses proton flow (chemiosmosis) to produce roughly 28–32 ATP molecules.
- Oxygen acts as the final electron acceptor, forming water (H2O).`;

class Store {
  constructor() {
    const saved = this.#loadFromDisk();
    this.state = {
      text: saved?.text ?? DEFAULT_SAMPLE,
      fontStyle: saved?.fontStyle ?? 'style-one',
      inkColor: saved?.inkColor ?? '#1b3b82',
      paperStyle: saved?.paperStyle ?? 'lined',
      variation: saved?.variation ?? 60,
      currentPage: 0,
      showAllPages: false
    };
    this.listeners = new Set();
  }

  #loadFromDisk() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.warn('Saved notes could not be read; using the default notes instead.', error);
      return null;
    }
  }

  #saveToDisk() {
    try {
      const { text, fontStyle, inkColor, paperStyle, variation } = this.state;
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ text, fontStyle, inkColor, paperStyle, variation })
      );
    } catch (error) {
      console.warn('Changes could not be saved to local storage.', error);
    }
  }

  getState() {
    return { ...this.state };
  }

  setState(patch) {
    this.state = { ...this.state, ...patch };
    this.#saveToDisk();
    this.listeners.forEach((fn) => fn(this.state));
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const store = new Store();
export { DEFAULT_SAMPLE };