# TypeScript readiness (JSDoc + `tsc --noEmit`), no build step

RoamWise is a static site with no build tooling: everything deploys as raw
files via GitHub Pages, loaded as classic (non-module) `<script>` tags in
`index.html`, and also wraps into a Capacitor Android WebView. This document
explains a dev-time-only type-checking layer added on top of that, and how
to extend it file by file.

## Why this approach

- **Zero build step.** `tsc` is used purely as a type *checker* here
  (`tsc --noEmit`), never as a compiler. Nothing it does changes what ships
  to the browser or the Android WebView — `.js` files stay `.js` files,
  loaded exactly as before.
- **Zero runtime risk.** The type annotations are [JSDoc
  comments](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)
  (`/** @param ... @returns ... */`) plus a `// @ts-check` / `// @ts-nocheck`
  pragma at the top of each file. Comments have no runtime effect — deleting
  every annotation added by this change would not alter behavior at all.
- **Works with the existing classic-script architecture.** No ES modules, no
  bundler, no `import`/`export` syntax is introduced. `tsc` type-checks the
  plain global-scope `.js` files as they already exist. This does not imply
  or require ever adopting a bundler/framework — that would be a separate,
  much larger decision if the project's architecture changes in the future.
- **Gradual, opt-in adoption.** With ~50+ files and no prior type
  annotations, trying to fix every error at once isn't practical. Instead,
  every existing file starts with `// @ts-nocheck` (opted out, unblocked,
  green baseline), and files are converted to real checking one at a time as
  time/need allows.

## What was added

- `typescript` as a **devDependency only** (`package.json`) — never
  imported or bundled into the shipped site, dev-tooling only.
- `tsconfig.json` at the repo root: `allowJs: true`, `checkJs: true`,
  `noEmit: true`, scoped to `app.js` and `js/**/*.js` (plus `js/global.d.ts`,
  see below). `node_modules`, `worker/` (a separate Cloudflare Worker
  project), and vendor/minified files are excluded from this initial pass.
- `npm run typecheck` — runs `tsc --noEmit` against that config.
- `npm run check` now also runs `npm run typecheck` as its last step,
  alongside the existing `node --check` syntax checks and the line-limit
  checker.
- `js/global.d.ts` — a small, type-only ambient declarations file for
  cross-file globals that are attached via `window.X = ...` property
  assignment elsewhere (e.g. `RWAudio`, defined in
  `platform-v5/audio-only.js`, which is outside this tsconfig's scope) and
  therefore aren't visible to `tsc` the way a plain top-level `var`/`function`
  declaration in an *included* file already is (see "How globals resolve"
  below). This file is erased entirely by every JS engine — it is never
  shipped and has zero runtime effect. Extend it (minimally — only the
  shape actually used) whenever a converted file needs a global that isn't
  already visible.
- `// @ts-nocheck` added to the top of every pre-existing file under
  `js/**/*.js` and to `app.js`, so the new tooling is installed and
  functional (green baseline) without being blocked by the ~800+ real type
  errors that surface across the untyped codebase today.

## Files already converted (real JSDoc types, `// @ts-check`, passing `tsc --noEmit` cleanly)

- `js/core/storage-utils.js`
- `js/core/text-utils.js`
- `js/pricing/tiers.js`
- `js/audio/cues.js`
- `js/data/iata.js`

Each of these had `// @ts-nocheck` removed, replaced with `// @ts-check`,
and got real `@param`/`@returns`/`@typedef` annotations on every exported
function — with **zero runtime/logic changes** (annotations are comments
only; verify with `git diff` that no non-comment line changed meaning).

## How to convert another file

1. Pick a file (smaller, more self-contained files are easier first —
   check its actual dependencies with `grep` before assuming it's
   self-contained; several "leaf" files still reach into globals defined in
   `app.js` or other modules).
2. Remove the `// @ts-nocheck` line at the top; add `// @ts-check` in its
   place (this is optional — once `checkJs: true` is set in `tsconfig.json`,
   simply removing `@ts-nocheck` is enough for `tsc --noEmit` runs, but
   `@ts-check` makes the intent explicit and also gets you checking in
   editors that don't load `tsconfig.json`).
3. Run `npm run typecheck` and see what surfaces for that file (errors from
   other still-`@ts-nocheck`'d files won't appear — each file's pragma is
   independent).
4. Add JSDoc `@param`/`@returns` to every function, and `@typedef` for any
   object shape that's repeated or non-trivial (see `js/pricing/tiers.js`
   for an example — `RWTier`, `RWFounderGate`).
5. If the file references a global defined in a file outside this
   tsconfig's scope (or attached via `window.X = ...` property assignment
   rather than `var X = ...`), add a minimal ambient declaration to
   `js/global.d.ts` rather than skipping the check — see the existing
   `RWAudio`/`RWAudioFocus`/`HTMLAudioElement._rwAudioOwner` entries there
   for the pattern.
6. Re-run `npm run typecheck` until clean. Do **not** change any
   non-comment line to "make the type checker happy" unless you are
   deliberately fixing a real, separately-reviewed bug it caught — a type
   annotation should describe the code, not the other way around.
7. Run `node --check <file>` to confirm the JSDoc comments didn't
   accidentally break plain JS syntax, then `npm test` and `npm run check`.

## How globals resolve across files

These are all non-module (classic `<script>`) files sharing one global
scope, exactly like the browser sees them. `tsc` models that: a top-level
`var foo = ...` or `function foo(){}` in *any* file included by
`tsconfig.json` (even one still marked `// @ts-nocheck` — the pragma only
suppresses error *reporting* for that file, it doesn't remove the file's
declarations from the shared program) is visible as a global to every other
included file, including as a property on `window` (TypeScript's DOM lib
types `Window` as `Window & typeof globalThis`). This is why, for example,
`js/pricing/tiers.js` can reference `isPro` and `window.db` — both are
declared with top-level `var` in `app.js` — without any extra declaration
file. It only breaks down for globals assigned via `window.X = ...` property
assignment (not a `var`/`function` declaration) or defined in a file outside
this tsconfig's `include`/`exclude` scope — that's what `js/global.d.ts` is
for.

## Scope notes

- `worker/` (a separate Cloudflare Worker project) is excluded from this
  pass and may get its own `tsconfig.json` later — it has a different
  runtime (Workers, not a browser/WebView) and shouldn't share config with
  the site's `tsconfig.json`.
- This is purely additive dev tooling. It does not imply, and is not a
  first step toward, adopting a bundler or compiler for the shipped site —
  that would be a separate, much bigger, separately-reviewed decision (e.g.
  if the project later adopts a framework that needs one).
