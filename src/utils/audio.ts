/**
 * Audio helpers — wraps SoundEngine and MusicEngine for convenient use.
 */

import { SoundEngine } from '@/engine/SoundEngine';
import { MusicEngine } from '@/engine/MusicEngine';

const soundEngine = new SoundEngine();
const musicEngine = new MusicEngine();

export async function initAudio(): Promise<void> {
  await soundEngine.init();
}

export async function playTone(color: string): Promise<void> {
  await soundEngine.playTone(color);
}

export async function playError(): Promise<void> {
  await soundEngine.playError();
}

export async function playSuccess(): Promise<void> {
  await soundEngine.playSuccess();
}

export async function playPerfect(): Promise<void> {
  await soundEngine.playSuccess();
}

export async function playPowerUp(): Promise<void> {
  await soundEngine.playPowerUp();
}

export async function playComboBreak(): Promise<void> {
  await soundEngine.playComboBreak();
}

export function setMuted(muted: boolean): void {
  soundEngine.setMuted(muted);
}

// Music controls
export async function startMusic(): Promise<void> {
  await musicEngine.start();
}

export async function stopMusic(): Promise<void> {
  await musicEngine.stop();
}

export async function setMusicIntensity(multiplier: number): Promise<void> {
  await musicEngine.setIntensity(multiplier);
}

export async function setMusicPadVolume(vol: number): Promise<void> {
  await musicEngine.setPadVolume(vol);
}
