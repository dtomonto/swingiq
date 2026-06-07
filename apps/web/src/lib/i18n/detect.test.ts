// ============================================================
// SwingVantage — Browser language detection tests
// Guards detectBrowserLanguage(): full preference-list walk,
// legacy code aliases, region-variant stripping, and fallbacks.
// ============================================================

import { detectBrowserLanguage } from './index';

// The detector reads the global `navigator`. The jest env is 'node', so we
// stub it per-test and restore afterward.
const originalNavigator = (global as { navigator?: unknown }).navigator;

function setNavigator(value: { language?: string; languages?: string[] } | undefined) {
  Object.defineProperty(global, 'navigator', {
    value,
    configurable: true,
    writable: true,
  });
}

afterEach(() => {
  if (originalNavigator === undefined) {
    delete (global as { navigator?: unknown }).navigator;
  } else {
    setNavigator(originalNavigator as { language?: string; languages?: string[] });
  }
});

describe('detectBrowserLanguage', () => {
  it('returns en when navigator is unavailable', () => {
    setNavigator(undefined);
    expect(detectBrowserLanguage()).toBe('en');
  });

  it('detects a supported primary language', () => {
    setNavigator({ language: 'es-ES', languages: ['es-ES'] });
    expect(detectBrowserLanguage()).toBe('es');
  });

  it('strips the region variant (pt-BR -> pt)', () => {
    setNavigator({ language: 'pt-BR', languages: ['pt-BR'] });
    expect(detectBrowserLanguage()).toBe('pt');
  });

  it('walks the full preference list to the first supported language', () => {
    // Top choice (Catalan) is unsupported; should fall to French.
    setNavigator({ language: 'ca-ES', languages: ['ca-ES', 'fr-FR', 'en-US'] });
    expect(detectBrowserLanguage()).toBe('fr');
  });

  it('maps the legacy Tagalog code tl -> fil', () => {
    setNavigator({ language: 'tl-PH', languages: ['tl-PH'] });
    expect(detectBrowserLanguage()).toBe('fil');
  });

  it('maps the legacy Indonesian code in -> id', () => {
    setNavigator({ language: 'in', languages: ['in'] });
    expect(detectBrowserLanguage()).toBe('id');
  });

  it('falls back to navigator.language when languages list is empty', () => {
    setNavigator({ language: 'de-DE', languages: [] });
    expect(detectBrowserLanguage()).toBe('de');
  });

  it('returns en when nothing in the list is supported', () => {
    setNavigator({ language: 'sw-KE', languages: ['sw-KE', 'am-ET'] });
    expect(detectBrowserLanguage()).toBe('en');
  });

  it('skips an unsupported legacy alias (iw) and keeps scanning', () => {
    setNavigator({ language: 'iw', languages: ['iw', 'ru-RU'] });
    expect(detectBrowserLanguage()).toBe('ru');
  });
});
