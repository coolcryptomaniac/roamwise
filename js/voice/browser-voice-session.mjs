import { createVoiceCoordinator } from './duplex-coordinator.mjs';

// Opt-in browser speech adapter. No microphone capture before start() is called.
// Browser speech recognition may stop during TTS; this is interruptible turn-taking,
// not simultaneous low-latency full duplex. Native Android bridge remains separate.
export function createBrowserVoiceSession({ Recognition, synthesis, Utterance, onTranscript, onStatus = () => {}, language = 'hi-IN' }) {
  if (typeof Recognition !== 'function' || typeof Utterance !== 'function' || !synthesis) throw new Error('Browser voice unavailable');
  if (typeof onTranscript !== 'function') throw new TypeError('Transcript handler required');
  const coordinator = createVoiceCoordinator({ onChange: onStatus, onCancel: () => { synthesis.cancel(); try { recognition.abort(); } catch (_) { /* best effort */ } } });
  const recognition = new Recognition();
  recognition.lang = language; recognition.continuous = false; recognition.interimResults = false;
  let active = false;
  recognition.onresult = (e) => {
    if (!active || coordinator.snapshot().mode !== 'listening') return;
    const transcript = String(e.results?.[0]?.[0]?.transcript || '').trim();
    if (!transcript) return;
    const token = coordinator.speechEnd().turn;
    onTranscript(transcript, token);
  };
  recognition.onerror = () => { if (active) onStatus({ ...coordinator.snapshot(), error: 'speech_recognition_failed' }); };
  return {
    start() { active = true; coordinator.listen(); recognition.start(); },
    interrupt() { coordinator.interrupt(); if (active) recognition.start(); },
    speak(text, token) {
      if (!active || !coordinator.reply(token)) return false;
      const utterance = new Utterance(String(text || ''));
      utterance.lang = language;
      utterance.onend = () => { if (active && coordinator.isCurrent(token)) { coordinator.listen(); try { recognition.start(); } catch (_) { /* user can restart */ } } };
      synthesis.speak(utterance); return true;
    },
    stop() { active = false; coordinator.stop(); },
    snapshot: coordinator.snapshot,
  };
}
