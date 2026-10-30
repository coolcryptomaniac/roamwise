import { nextVoiceTurn } from './duplex-turn-core.mjs';

// Browser-agnostic coordinator; caller owns mic permission, ASR, TTS and transport.
// Generation tokens let callers discard late responses after a barge-in.
export function createVoiceCoordinator({ onChange = () => {}, onCancel = () => {} } = {}) {
  let state = { mode: 'idle', turn: 0 };
  const emit = (event) => { state = nextVoiceTurn(state, event); onChange({ ...state }); return { ...state }; };
  return {
    snapshot: () => ({ ...state }),
    listen: () => emit('listen'),
    speechEnd: () => emit('speech-end'),
    reply: (token) => token === state.turn && state.mode === 'thinking' ? emit('reply') : null,
    interrupt: () => { onCancel(); return emit('interrupt'); },
    stop: () => { onCancel(); return emit('stop'); },
    isCurrent: (token) => token === state.turn,
  };
}
