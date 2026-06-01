// ============================================================
// Guard test: the production video-analysis UI must not show users
// heuristic / estimated / simulated / placeholder language. Developer
// comments are stripped before checking (they are allowed to explain
// the no-fake design); only real user-facing copy is asserted.
// ============================================================

import { readFileSync } from 'fs';
import { join } from 'path';

const UI_FILES = [
  join(__dirname, '..', 'VideoAnalyzerContent.tsx'),
  join(__dirname, '..', 'SportVideoAnalyzerContent.tsx'),
  join(__dirname, '..', '..', '..', 'components', 'video', 'AIVisualAnalysisPanel.tsx'),
  join(__dirname, '..', '..', '..', 'components', 'video', 'AnalysisProgress.tsx'),
  join(__dirname, '..', '..', '..', 'components', 'video', 'AINotConfiguredNotice.tsx'),
];

/** Strip block + line comments so we only inspect user-facing copy. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

const FORBIDDEN = [
  'heuristic',
  'simulated',
  'placeholder',
  'rule-based',
  'canned',
  '⚠ estimated',
  'not measured from your',
  'all estimated',
];

describe('video UI contains no user-facing heuristic language', () => {
  for (const file of UI_FILES) {
    test(`${file.split(/[\\/]/).pop()} is clean`, () => {
      const code = stripComments(readFileSync(file, 'utf8')).toLowerCase();
      for (const term of FORBIDDEN) {
        expect(code).not.toContain(term);
      }
    });
  }
});
