/**
 * SoundEngine — Cyberpunk-style synth audio for EchoShift.
 *
 * Generates synthetic waveforms with harmonics, detune, and decay envelopes
 * for a dark, futuristic sound palette.
 *
 * Color → Synth mapping:
 *   Cyan    (#00f5d4) -> Square wave  C5 (523 Hz) + sub octave — clean digital
 *   Magenta (#f72585) -> Saw wave     E5 (659 Hz) + detune — aggressive, hot
 *   Yellow  (#ffd166) -> Triangle     G5 (784 Hz) + shimmer — bright, electric
 *   Violet  (#7b2fff) -> Pulse wave   B5 (988 Hz) + sub — deep, mysterious
 */

import { Audio } from 'expo-av';
import { useSettingsStore } from '@/store/settingsStore';

type WaveType = 'sine' | 'square' | 'saw' | 'triangle' | 'pulse';

interface ToneConfig {
  freq: number;
  wave: WaveType;
  duration: number;
  volume: number;
  detune?: number;       // Hz offset for second oscillator
  subOctave?: number;    // volume of sub-octave layer (0-1)
  decayCurve?: number;   // exponential decay factor (higher = faster decay)
  harmonics?: number[];  // additional harmonic multipliers
}

const COLOR_TONES: Record<string, ToneConfig> = {
  '#00f5d4': {
    freq: 523, wave: 'square', duration: 0.18, volume: 0.22,
    subOctave: 0.12, decayCurve: 4, harmonics: [2],
  },
  '#f72585': {
    freq: 659, wave: 'saw', duration: 0.16, volume: 0.2,
    detune: 3, decayCurve: 5, harmonics: [1.5],
  },
  '#ffd166': {
    freq: 784, wave: 'triangle', duration: 0.15, volume: 0.24,
    detune: 1.5, decayCurve: 3.5, harmonics: [3],
  },
  '#7b2fff': {
    freq: 988, wave: 'pulse', duration: 0.2, volume: 0.18,
    subOctave: 0.15, decayCurve: 4.5,
  },
};

const ERROR_TONE: ToneConfig = {
  freq: 150, wave: 'saw', duration: 0.25, volume: 0.25,
  detune: 8, decayCurve: 3, harmonics: [1.5, 2.5],
};

const POWERUP_TONE: ToneConfig = {
  freq: 1200, wave: 'sine', duration: 0.12, volume: 0.15,
  decayCurve: 6,
};

const SAMPLE_RATE = 44100;

/** Generate a single oscillator sample */
function oscillator(wave: WaveType, phase: number): number {
  const p = phase % 1;
  switch (wave) {
    case 'sine':
      return Math.sin(2 * Math.PI * p);
    case 'square':
      return p < 0.5 ? 0.8 : -0.8;
    case 'saw':
      return 2 * p - 1;
    case 'triangle':
      return p < 0.5 ? 4 * p - 1 : 3 - 4 * p;
    case 'pulse':
      return p < 0.35 ? 0.9 : -0.9;
    default:
      return Math.sin(2 * Math.PI * p);
  }
}

/** Generate a cyberpunk-style WAV tone */
function generateCyberWav(config: ToneConfig): string {
  const { freq, wave, duration, volume, detune = 0, subOctave = 0, decayCurve = 3, harmonics = [] } = config;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = SAMPLE_RATE * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = numSamples * blockAlign;
  const fileSize = 36 + dataSize;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, fileSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const progress = i / numSamples;

    // Exponential decay envelope with sharp attack
    const attack = Math.min(1, i / (SAMPLE_RATE * 0.005)); // 5ms attack
    const decay = Math.exp(-decayCurve * progress);
    const envelope = attack * decay;

    // Main oscillator
    let sample = oscillator(wave, freq * t);

    // Detuned second oscillator for thickness
    if (detune > 0) {
      sample = sample * 0.65 + oscillator(wave, (freq + detune) * t) * 0.35;
    }

    // Sub-octave layer for weight
    if (subOctave > 0) {
      sample += oscillator('sine', (freq / 2) * t) * subOctave;
    }

    // Additional harmonics for texture
    for (const h of harmonics) {
      sample += oscillator('sine', freq * h * t) * 0.08 * Math.exp(-6 * progress);
    }

    // Apply envelope and volume
    const final = sample * envelope * volume;
    const clamped = Math.max(-1, Math.min(1, final));
    view.setInt16(44 + i * 2, clamped * 0x7FFF, true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return 'data:audio/wav;base64,' + btoa(binary);
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

// Pre-generate and cache all tone URIs
const toneCache = new Map<string, string>();

function getCachedUri(key: string, config: ToneConfig): string {
  let uri = toneCache.get(key);
  if (!uri) {
    uri = generateCyberWav(config);
    toneCache.set(key, uri);
  }
  return uri;
}

export class SoundEngine {
  private initialized = false;
  private muted = false;

  async init(): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
      this.initialized = true;

      // Pre-warm the cache
      for (const [color, config] of Object.entries(COLOR_TONES)) {
        getCachedUri(color, config);
      }
      getCachedUri('error', ERROR_TONE);
      getCachedUri('powerup', POWERUP_TONE);
    } catch {
      // Audio init failed
    }
  }

  private async play(uri: string, vol: number): Promise<void> {
    if (this.muted || !this.initialized) return;
    if (!useSettingsStore.getState().soundEnabled) return;

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, volume: vol },
      );
      sound.setOnPlaybackStatusUpdate((status) => {
        if ('didJustFinish' in status && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch {
      // Silently fail
    }
  }

  async playTone(color: string): Promise<void> {
    const config = COLOR_TONES[color];
    if (!config) return;
    const uri = getCachedUri(color, config);
    await this.play(uri, config.volume);
  }

  async playError(): Promise<void> {
    const uri = getCachedUri('error', ERROR_TONE);
    await this.play(uri, ERROR_TONE.volume);
  }

  async playSuccess(): Promise<void> {
    // Ascending cyberpunk arpeggio — C5 → E5 → G5 (square waves)
    const notes: ToneConfig[] = [
      { freq: 523, wave: 'square', duration: 0.1, volume: 0.18, decayCurve: 5 },
      { freq: 659, wave: 'square', duration: 0.1, volume: 0.18, decayCurve: 5 },
      { freq: 784, wave: 'triangle', duration: 0.18, volume: 0.2, decayCurve: 3, harmonics: [2] },
    ];
    for (let i = 0; i < notes.length; i++) {
      const uri = getCachedUri(`success_${i}`, notes[i]!);
      this.play(uri, notes[i]!.volume);
      await new Promise((r) => setTimeout(r, 70));
    }
  }

  async playComboBreak(): Promise<void> {
    // Harsh descending saw
    const notes: ToneConfig[] = [
      { freq: 400, wave: 'saw', duration: 0.12, volume: 0.2, detune: 6, decayCurve: 4 },
      { freq: 250, wave: 'saw', duration: 0.18, volume: 0.22, detune: 10, decayCurve: 3 },
    ];
    for (let i = 0; i < notes.length; i++) {
      const uri = getCachedUri(`combobreak_${i}`, notes[i]!);
      this.play(uri, notes[i]!.volume);
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  async playPowerUp(): Promise<void> {
    // Quick bright chirp
    const uri = getCachedUri('powerup', POWERUP_TONE);
    await this.play(uri, POWERUP_TONE.volume);
  }

  async playFreq(freq: number): Promise<void> {
    const config: ToneConfig = { freq, wave: 'sine', duration: 0.12, volume: 0.2, decayCurve: 5 };
    const uri = getCachedUri(`freq_${freq}`, config);
    await this.play(uri, config.volume);
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  isMuted(): boolean {
    return this.muted;
  }
}
