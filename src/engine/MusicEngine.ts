/**
 * MusicEngine — Generative background music that reacts to gameplay.
 *
 * Creates a dark, ambient cyberpunk soundscape:
 * - Base drone: low sine pad that pulses slowly
 * - BPM increases with combo multiplier
 * - On combo milestones: melodic arpeggios layer in
 * - On combo break: bass drop + silence
 *
 * Uses the same WAV synthesis approach as SoundEngine for consistency.
 */

import { Audio } from 'expo-av';
import { useSettingsStore } from '@/store/settingsStore';

const SAMPLE_RATE = 44100;

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/** Generate a loopable ambient pad WAV */
function generatePad(freq: number, duration: number, volume: number): string {
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const dataSize = numSamples * 2;
  const fileSize = 36 + dataSize;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, fileSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const progress = i / numSamples;

    // Smooth fade in/out for seamless looping
    const fadeIn = Math.min(1, i / (SAMPLE_RATE * 0.5));
    const fadeOut = Math.min(1, (numSamples - i) / (SAMPLE_RATE * 0.5));
    const envelope = fadeIn * fadeOut;

    // Deep sine pad + slow LFO modulation
    const lfo = 1 + 0.3 * Math.sin(2 * Math.PI * 0.15 * t);
    let sample = Math.sin(2 * Math.PI * freq * t) * lfo;

    // Fifth harmonic for thickness
    sample += Math.sin(2 * Math.PI * freq * 1.5 * t) * 0.15;

    // Sub bass
    sample += Math.sin(2 * Math.PI * (freq / 2) * t) * 0.2;

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

/** Generate a rhythmic pulse beat */
function generateBeat(bpm: number, duration: number, volume: number): string {
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const dataSize = numSamples * 2;
  const fileSize = 36 + dataSize;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, fileSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  const beatInterval = 60 / bpm; // seconds per beat

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const progress = i / numSamples;

    // Fade in/out
    const fadeIn = Math.min(1, i / (SAMPLE_RATE * 0.3));
    const fadeOut = Math.min(1, (numSamples - i) / (SAMPLE_RATE * 0.3));

    // Kick-like hit on each beat
    const beatPhase = (t % beatInterval) / beatInterval;
    const kick = beatPhase < 0.08
      ? Math.sin(2 * Math.PI * (80 - 60 * beatPhase / 0.08) * t) * Math.exp(-beatPhase * 40)
      : 0;

    // Hi-hat on off-beats
    const halfBeat = ((t + beatInterval / 2) % beatInterval) / beatInterval;
    const hihat = halfBeat < 0.02
      ? (Math.random() * 2 - 1) * 0.15 * Math.exp(-halfBeat * 80)
      : 0;

    const final = (kick * 0.6 + hihat) * volume * fadeIn * fadeOut;
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

// Pre-generated music layers
const PAD_DURATION = 8; // 8 second loops
const BEAT_DURATION = 4; // 4 second beat loops

const padUri = generatePad(55, PAD_DURATION, 0.06); // A1 = 55Hz drone
const beatSlowUri = generateBeat(80, BEAT_DURATION, 0.08);
const beatMedUri = generateBeat(100, BEAT_DURATION, 0.1);
const beatFastUri = generateBeat(130, BEAT_DURATION, 0.12);

export class MusicEngine {
  private padSound: Audio.Sound | null = null;
  private beatSound: Audio.Sound | null = null;
  private currentBpm: 'slow' | 'med' | 'fast' | 'none' = 'none';
  private playing = false;

  async start(): Promise<void> {
    if (this.playing) return;
    if (!useSettingsStore.getState().musicEnabled) return;

    try {
      // Start ambient pad
      const { sound: pad } = await Audio.Sound.createAsync(
        { uri: padUri },
        { shouldPlay: true, isLooping: true, volume: 0.06 },
      );
      this.padSound = pad;
      this.playing = true;
    } catch {
      // Music is non-critical
    }
  }

  async stop(): Promise<void> {
    this.playing = false;
    this.currentBpm = 'none';

    try {
      if (this.padSound) {
        await this.padSound.stopAsync();
        await this.padSound.unloadAsync();
        this.padSound = null;
      }
      if (this.beatSound) {
        await this.beatSound.stopAsync();
        await this.beatSound.unloadAsync();
        this.beatSound = null;
      }
    } catch {
      this.padSound = null;
      this.beatSound = null;
    }
  }

  /** Update music intensity based on combo multiplier */
  async setIntensity(multiplier: number): Promise<void> {
    if (!this.playing) return;
    if (!useSettingsStore.getState().musicEnabled) return;

    const targetBpm: 'slow' | 'med' | 'fast' | 'none' =
      multiplier >= 5 ? 'fast' :
      multiplier >= 3 ? 'med' :
      multiplier >= 2 ? 'slow' : 'none';

    if (targetBpm === this.currentBpm) return;

    // Stop current beat layer
    if (this.beatSound) {
      try {
        await this.beatSound.stopAsync();
        await this.beatSound.unloadAsync();
      } catch {}
      this.beatSound = null;
    }

    if (targetBpm === 'none') {
      this.currentBpm = 'none';
      return;
    }

    // Start new beat layer
    const uri = targetBpm === 'fast' ? beatFastUri :
                targetBpm === 'med' ? beatMedUri : beatSlowUri;

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, isLooping: true, volume: targetBpm === 'fast' ? 0.12 : 0.08 },
      );
      this.beatSound = sound;
      this.currentBpm = targetBpm;
    } catch {
      // Non-critical
    }
  }

  /** Adjust pad volume (e.g., lower during observe phase) */
  async setPadVolume(vol: number): Promise<void> {
    if (this.padSound) {
      try {
        await this.padSound.setVolumeAsync(vol);
      } catch {}
    }
  }
}
