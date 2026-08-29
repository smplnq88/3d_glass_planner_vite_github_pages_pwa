// Synthesizer styles for alarm alarms using Web Audio API
import { AlarmSoundType } from '../types';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  return audioCtx;
}

/**
 * Play a beautiful digital synthesizer alarm pattern based on selected soundType.
 */
export function playAlarmSound(soundType: AlarmSoundType = 'zen_bell'): () => void {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    let isStopped = false;
    const activeNodes: (OscillatorNode | GainNode | BiquadFilterNode)[] = [];

    const playTone = (
      freq: number,
      startTime: number,
      duration: number,
      type: OscillatorType = 'sine',
      volume = 0.25,
      filterFreq = 0
    ) => {
      if (isStopped) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      let lastNode: AudioNode = osc;

      if (filterFreq > 0) {
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(filterFreq, startTime);
        osc.connect(filter);
        lastNode = filter;
        activeNodes.push(filter);
      }

      lastNode.connect(gain);
      gain.connect(ctx.destination);

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      // Volume envelope (Attack / Decay)
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(volume, startTime + Math.min(0.08, duration * 0.15));
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration);

      activeNodes.push(osc, gain);
    };

    const triggerSequence = () => {
      const now = ctx.currentTime;

      switch (soundType) {
        case 'digital_beep': {
          // Classic crisp digital tech beep: two rapid high pitch beeps
          playTone(880, now, 0.1, 'square', 0.12);
          playTone(880, now + 0.15, 0.1, 'square', 0.12);
          playTone(880, now + 0.7, 0.1, 'square', 0.12);
          playTone(880, now + 0.85, 0.1, 'square', 0.12);
          break;
        }
        case 'morning_harp': {
          // Soft cascading pentatonic harp roll
          playTone(261.63, now, 0.8, 'triangle', 0.18);       // C4
          playTone(293.66, now + 0.12, 0.8, 'triangle', 0.18); // D4
          playTone(329.63, now + 0.24, 0.8, 'triangle', 0.18); // E4
          playTone(392.00, now + 0.36, 1.2, 'triangle', 0.18); // G4
          playTone(440.00, now + 0.48, 1.2, 'triangle', 0.18); // A4
          playTone(523.25, now + 0.60, 1.5, 'triangle', 0.18); // C5
          break;
        }
        case 'cosmic_synth': {
          // Warm 3-frequency analog chord pad sweep with lowpass filter
          playTone(220.00, now, 2.5, 'sawtooth', 0.15, 600); // A3
          playTone(277.18, now + 0.1, 2.5, 'sawtooth', 0.12, 600); // C#4
          playTone(329.63, now + 0.2, 2.5, 'sawtooth', 0.12, 600); // E4
          playTone(493.88, now + 0.3, 2.5, 'sawtooth', 0.10, 600); // B4
          break;
        }
        case 'zen_bell':
        default: {
          // E-major pentatonic bell run
          playTone(329.63, now, 1.5, 'sine', 0.22);       // E4
          playTone(392.00, now + 0.2, 1.5, 'sine', 0.22); // G4
          playTone(523.25, now + 0.4, 2.0, 'sine', 0.22); // C5
          playTone(659.25, now + 0.6, 2.5, 'sine', 0.22); // E5
          break;
        }
      }
    };

    // First ring
    triggerSequence();

    // Setup repeating loop intervals depending on sound style
    const loopDuration = soundType === 'digital_beep' ? 2000 : 3500;
    const intervalId = setInterval(() => {
      if (isStopped) return;
      triggerSequence();
    }, loopDuration);

    // Return a stopper function to safely clear the audio state
    return () => {
      isStopped = true;
      clearInterval(intervalId);
      activeNodes.forEach((node) => {
        try {
          node.disconnect();
        } catch (e) {
          // already disconnected
        }
      });
    };
  } catch (e) {
    console.warn('Web Audio Context not activated yet or unsupported:', e);
    return () => {};
  }
}
