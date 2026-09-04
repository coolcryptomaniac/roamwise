'use strict';

/*
 * ESLint flat config (eslint.config.js) for RoamWise.
 *
 * This is a plain classic-script, no-bundler, no-framework codebase: every
 * file loads via a <script> tag in index.html, functions/data are declared
 * as top-level globals, and ~287+ of those globals are referenced across
 * files and from inline HTML `onclick="..."` attributes that static
 * analysis can't see. See ARCHITECTURE.md and js/global.d.ts for the full
 * rationale. Two consequences for this config:
 *
 *   - `no-undef` is disabled. Enumerating every cross-file global by hand
 *     would be a huge, constantly-drifting allowlist; `tsc --noEmit`
 *     (see tsconfig.json / js/global.d.ts) already understands this
 *     pattern via ambient declarations and catches genuine
 *     undefined-reference bugs instead.
 *   - `no-unused-vars` is a warning, not an error: some top-level
 *     functions/exports are only ever invoked from inline `onclick=`
 *     HTML attributes, which ESLint's static analysis can't see, so
 *     false positives are expected.
 *
 * Rule thresholds (see ARCHITECTURE.md "line limits" section for the
 * reasoning):
 *   - max-lines: 500 (error) — the enforced ceiling, replacing the old
 *     bespoke tools/check-line-limits.js hard cap.
 *   - max-lines-per-function: 50 (warning) — an aspirational, non-blocking
 *     target; this codebase has plenty of pre-existing larger functions.
 */

const js = require('@eslint/js');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'worker/**',
      '**/*.min.js',
      'itinerary-library/**',
      'vendor/**',
    ],
  },
  {
    files: ['js/**/*.js', 'app.js'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'script',
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        Audio: 'readonly',
        Image: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        Blob: 'readonly',
        FormData: 'readonly',
        Headers: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        Notification: 'readonly',
        FileReader: 'readonly',
        WebSocket: 'readonly',
        IntersectionObserver: 'readonly',
        MutationObserver: 'readonly',
        ResizeObserver: 'readonly',
        CustomEvent: 'readonly',
        Event: 'readonly',
        history: 'readonly',
        location: 'readonly',
        crypto: 'readonly',
        performance: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        require: 'readonly',
        global: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': 'warn',
      // Plain classic scripts: hundreds of cross-file globals referenced
      // with no import/export and from inline onclick= HTML attributes.
      // tsc --noEmit (via js/global.d.ts) covers genuine undefined-reference
      // bugs instead — see file header comment above.
      'no-undef': 'off',
      'max-lines': ['error', { max: 500, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['warn', { max: 50, skipBlankLines: true, skipComments: true }],
    },
  },
];
