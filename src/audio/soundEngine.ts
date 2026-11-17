import { GameSettings } from '../types/game';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private musicTimer: number | null = null;
  private musicStep = 0;
  private settings: GameSettings = {
    graphicsQuality: 'high',
    masterVolume: 0.7,
    musicEnabled: true,
    sfxEnabled: true,
    voiceEnabled: true,
    showHindi: true,
    showOdia: true,
    audioInstructions: true,
    textSize: 'normal',
    parentalSafeExploreAll: true,
  };

  public updateSettings(next: GameSettings) {
    this.settings = next;
    if (!next.musicEnabled || next.masterVolume <= 0.01) {
      this.stopMusic();
    }
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlock() {
    this.ensureContext();
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainVal = 0.14,
    delay = 0,
  ) {
    if (!this.settings.sfxEnabled || this.settings.masterVolume <= 0.01) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    const vol = Math.max(0.001, gainVal * this.settings.masterVolume);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(vol, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playClick() {
    this.playTone(540, 0.06, 'triangle', 0.08);
  }

  public playCollect(pitchOffset = 0) {
    const base = 523.25 * (1 + pitchOffset * 0.06);
    this.playTone(base, 0.12, 'triangle', 0.14, 0);
    this.playTone(base * 1.25, 0.16, 'sine', 0.12, 0.06);
  }

  public playCorrect() {
    this.playTone(523.25, 0.14, 'triangle', 0.15, 0);
    this.playTone(659.25, 0.14, 'triangle', 0.15, 0.08);
    this.playTone(783.99, 0.24, 'sine', 0.16, 0.16);
  }

  public playWrong() {
    this.playTone(230, 0.16, 'sawtooth', 0.08, 0);
    this.playTone(185, 0.22, 'sawtooth', 0.07, 0.1);
  }

  public playVictory() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.25, 'triangle', 0.15, idx * 0.09);
    });
  }

  public startMusic() {
    if (typeof window === 'undefined') return;
    if (!this.settings.musicEnabled || this.settings.masterVolume <= 0.01) return;
    if (this.musicTimer !== null) return;

    // Gentle pentatonic marimba loop (C5, D5, E5, G5, A5)
    const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 392.0, 329.63];
    this.musicTimer = window.setInterval(() => {
      if (!this.settings.musicEnabled || this.settings.masterVolume <= 0.01) return;
      if (document.hidden) return;
      const ctx = this.ctx;
      if (!ctx || ctx.state !== 'running') return;

      const freq = scale[this.musicStep % scale.length];
      this.musicStep++;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      const vol = 0.032 * this.settings.masterVolume;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(vol, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.48);
    }, 520);
  }

  public stopMusic() {
    if (this.musicTimer !== null && typeof window !== 'undefined') {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  public speak(text: string, lang = 'en-US') {
    if (!this.settings.voiceEnabled || this.settings.masterVolume <= 0.01) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.volume = Math.min(1, Math.max(0.1, this.settings.masterVolume));
      utter.rate = 0.94;
      utter.pitch = 1.05;
      const voices = window.speechSynthesis.getVoices();
      const match =
        voices.find((v) => v.lang.toLowerCase().startsWith(lang.toLowerCase())) ||
        voices.find((v) => v.lang.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()));
      if (match) {
        utter.voice = match;
        utter.lang = match.lang;
      } else {
        utter.lang = 'en-US';
      }
      window.speechSynthesis.speak(utter);
    } catch {
      // Graceful fallback if speech synthesis is blocked or unavailable
    }
  }

  public speakWorldPhrase(letter: string, word: string, hindi?: string, odia?: string) {
    if (!this.settings.voiceEnabled) return;
    let phrase = `${letter} for ${word}.`;
    if (this.settings.showHindi && hindi) {
      phrase += ` In Hindi: ${hindi.replace(/\(.*?\)/g, '')}.`;
    }
    if (this.settings.showOdia && odia) {
      // Extract phonetic bracketed form for clear speech fallback
      const match = odia.match(/\(([^)]+)\)/);
      phrase += ` In Odia: ${match ? match[1] : word}.`;
    }
    this.speak(phrase, 'en-US');
  }
}

export const soundEngine = new SoundEngine();
