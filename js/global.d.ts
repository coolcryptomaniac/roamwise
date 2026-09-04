/**
 * Ambient type declarations for cross-file globals that are attached to
 * `window` by classic (non-module) <script> files loaded elsewhere in
 * index.html's script chain, and therefore aren't visible to `tsc` just by
 * being included in this project the way plain top-level `var`/`function`
 * declarations are (see TYPESCRIPT-MIGRATION.md).
 *
 * This file is type-only (a `.d.ts`, erased entirely by every JS engine and
 * never shipped) and only grows as more converted files need a global it
 * references. Keep each declaration to the minimal shape actually used by
 * the converted call sites — these are duck-typed contracts, not full specs
 * of the source file's public API.
 */

interface RWAudioGlobal {
  isEnabled?: () => boolean;
  isPlaying?: () => boolean;
  isLoopEnabled?: () => boolean;
  play?: () => void;
}

interface RWAudioFocusGlobal {
  claim?: (owner: string, onSteal: () => void) => void;
  release?: (owner: string) => void;
}

interface Window {
  /** Defined in platform-v5/audio-only.js (outside this project's tsconfig scope). */
  RWAudio?: RWAudioGlobal;
  /** Defined in js/audio/focus.js. */
  RWAudioFocus?: RWAudioFocusGlobal;
  /** Defined in js/core/include-partial.js; re-runs the data-include fetch-and-inject pass. */
  includeAllPartials?: () => void;
}

/**
 * Browser globals declared via `window.X = ...` property assignment (rather
 * than a top-level `var X = ...`) aren't automatically visible as bare
 * identifiers to `tsc` the way real `var`/`function` declarations are, even
 * though the browser makes every `window` property accessible unqualified.
 * Re-declare the bare names here so converted files can reference them
 * either way, matching actual runtime behavior.
 */
declare var RWAudio: RWAudioGlobal | undefined;
declare var RWAudioFocus: RWAudioFocusGlobal | undefined;

interface HTMLAudioElement {
  /** Debug tag set by js/audio/cues.js to identify which subsystem owns a shared <audio> node. */
  _rwAudioOwner?: string;
}
