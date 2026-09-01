// Audio and Haptic feedback utility for workout timers
let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
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
 * Plays a distinct 5-second vibration and pulsing low-frequency buzzer sound
 * specifically designed to simulate phone vibration sound + triggers device haptics.
 */
export function playFiveSecondVibrateAlarm() {
  // 1. Hardware vibration for mobile devices supporting navigator.vibrate
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      // 5-second vibration pattern with intense pulses
      navigator.vibrate([800, 200, 800, 200, 800, 200, 800, 200, 800]);
    } catch (e) {
      console.warn('Haptic vibration failed:', e);
    }
  }

  // 2. Synthesized 5-second vibrating buzzer tone using Web Audio API (works on iOS & Android browsers)
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const startTime = ctx.currentTime;
    const duration = 5.0; // exactly 5 seconds

    // Master gain
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.3, startTime);
    masterGain.gain.setValueAtTime(0.3, startTime + duration - 0.2);
    masterGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    masterGain.connect(ctx.destination);

    // Modulator LFO for heavy vibrating phone pulsation effect (~8Hz modulation)
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(8, startTime);

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0.4, startTime);

    // Primary low-end buzzer frequency (simulating motor hum at 140Hz with harmonic 280Hz)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(140, startTime);

    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(280, startTime);

    // Connect LFO modulation to tone amplitude
    const toneGain = ctx.createGain();
    toneGain.gain.setValueAtTime(0.5, startTime);
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
