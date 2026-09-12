// Audio and Haptic feedback utility for workout timers
let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (window.navigator.userActivation && !window.navigator.userActivation.hasBeenActive) return null;
  const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtxClass) return null;

  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtxClass();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

// Unlock audio context on first user interaction so iOS Safari & mobile Chrome allow playing sounds
export function initAudioUnlock() {
  if (typeof window === 'undefined') return;
  const unlock = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    window.removeEventListener('touchstart', unlock);
    window.removeEventListener('click', unlock);
  };
  window.addEventListener('touchstart', unlock, { passive: true });
  window.addEventListener('click', unlock, { passive: true });
}

/**
 * Plays a light 1-second vibration and gentle pulsing buzzer sound
 * specifically designed to simulate a soft phone vibration buzz + triggers device haptics.
 */
export function playOneSecondVibrateAlarm() {
  // 1. Hardware vibration for mobile devices supporting navigator.vibrate
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      // Light 1-second vibration pattern (350ms buzz, 150ms pause, 500ms buzz)
      navigator.vibrate([350, 150, 500]);
    } catch (e) {
      console.warn('Haptic vibration failed:', e);
    }
  }

  // 2. Synthesized 1-second light vibrating buzzer tone using Web Audio API (works on iOS & Android browsers)
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const startTime = ctx.currentTime;
    const duration = 1.0; // exactly 1 second

    // Master gain - soft gentle volume
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.18, startTime);
    masterGain.gain.setValueAtTime(0.18, startTime + duration - 0.15);
    masterGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    masterGain.connect(ctx.destination);

    // Modulator LFO for gentle vibrating phone pulsation effect (~8Hz modulation)
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(8, startTime);

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0.3, startTime);

    // Primary low-end buzzer frequency (soft hum at 130Hz with gentle harmonic at 260Hz)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(130, startTime);

    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(260, startTime);

    // Connect LFO modulation to tone amplitude
    const toneGain = ctx.createGain();
    toneGain.gain.setValueAtTime(0.35, startTime);
    lfo.connect(lfoGain);
    lfoGain.connect(toneGain.gain);

    osc1.connect(toneGain);
    osc2.connect(toneGain);
    toneGain.connect(masterGain);

    lfo.start(startTime);
    osc1.start(startTime);
    osc2.start(startTime);

    lfo.stop(startTime + duration);
    osc1.stop(startTime + duration);
    osc2.stop(startTime + duration);
  } catch (err) {
    console.warn('Audio alarm synthesis failed:', err);
  }
}

// Backward-compatible alias
export const playThreeSecondVibrateAlarm = playOneSecondVibrateAlarm;

/**
 * Short beep for 3, 2, 1 countdown cues
 */
export function playCountdownBeep(freq = 600, duration = 0.12) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const startTime = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.15, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(60);
    }
  } catch (e) {
    // Ignore audio cue errors
  }
}

/**
 * Tonal sound effect for workout completion or celebratory moments
 */
export function playCelebrationTones() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio
    notes.forEach((freq, idx) => {
      const startTime = ctx.currentTime + idx * 0.1;
      const duration = 0.25;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([100, 50, 100, 50, 200]);
    }
  } catch {
    // Ignore audio cue errors
  }
}

export const soundEffects = {
  playFinish: playCelebrationTones,
  playOneSecondVibrateAlarm,
  playCountdownBeep,
};
