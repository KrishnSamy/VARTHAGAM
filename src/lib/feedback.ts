/**
 * High-Gain Auditory and Haptic Feedback System for VARTHAGAM (வர்த்தகம்).
 * Uses Web Audio API with Dynamics Compression & Harmonic Synthesis
 * to deliver loud, clear, penetrating soundbox chimes on noisy shop phones
 * (0 KB audio file download, 100% offline).
 */

class FeedbackManager {
  private audioCtx: AudioContext | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * High-Volume Multi-Tone Loud Soundbox Chime for New Kiosk / Customer Orders.
   * Cuts through loud street traffic, milk steamers, and noisy tea stall environments.
   * Emulates commercial Paytm / PhonePe Soundbox chime.
   */
  public playLoudOrderAlert() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Master Gain Boost for extra penetration in street shops
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(1.8, now);
      masterGain.connect(ctx.destination);

      // Dynamics Compressor to maximize clean volume and punch without distortion
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-12, now);
      compressor.knee.setValueAtTime(4, now);
      compressor.ratio.setValueAtTime(16, now);
      compressor.attack.setValueAtTime(0.002, now);
      compressor.release.setValueAtTime(0.18, now);
      compressor.connect(masterGain);

      // 3 penetrating high-attention harmonic phrases: Ting-Tong-Ting! (Paytm/PhonePe Soundbox style)
      const chords = [
        { time: 0.0, freq1: 1046.5, freq2: 2093.0, freq3: 3135.0 }, // C6 + C7 + G7
        { time: 0.15, freq1: 1318.5, freq2: 2637.0, freq3: 3951.0 }, // E6 + E7 + B7
        { time: 0.30, freq1: 1568.0, freq2: 3136.0, freq3: 4700.0 }, // G6 + G7 + D8
        { time: 0.60, freq1: 1318.5, freq2: 2637.0, freq3: 3951.0 }, // Repeat chime phrase
        { time: 0.78, freq1: 1760.0, freq2: 3520.0, freq3: 5280.0 }, // Piercing High A Bell finish
      ];

      chords.forEach(({ time, freq1, freq2, freq3 }) => {
        // Fundamental Tone
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(freq1, now + time);
        gain1.gain.setValueAtTime(0, now + time);
        gain1.gain.linearRampToValueAtTime(1.0, now + time + 0.01);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + time + 0.5);
        osc1.connect(gain1);
        gain1.connect(compressor);
        osc1.start(now + time);
        osc1.stop(now + time + 0.55);

        // High Harmonic shimmer
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq2, now + time);
        gain2.gain.setValueAtTime(0, now + time);
        gain2.gain.linearRampToValueAtTime(0.8, now + time + 0.01);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + time + 0.4);
        osc2.connect(gain2);
        gain2.connect(compressor);
        osc2.start(now + time);
        osc2.stop(now + time + 0.45);

        // Piercing overtone for low-end smartphone earpieces / speakers
        const osc3 = ctx.createOscillator();
        const gain3 = ctx.createGain();
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(freq3, now + time);
        gain3.gain.setValueAtTime(0, now + time);
        gain3.gain.linearRampToValueAtTime(0.5, now + time + 0.01);
        gain3.gain.exponentialRampToValueAtTime(0.001, now + time + 0.3);
        osc3.connect(gain3);
        gain3.connect(compressor);
        osc3.start(now + time);
        osc3.stop(now + time + 0.35);
      });

      // Powerful haptic pulse (long-short-long)
      this.vibrate([400, 150, 400, 150, 600]);
    } catch (e) {
      // Audio policy safe
    }
  }

  /**
   * Loud standard chime for order updates.
   */
  public playNewOrderChime() {
    this.playLoudOrderAlert();
  }

  /**
   * Crystal Clear Payment Confirmed Bell Tone (E6 + B6 Ding).
   */
  public playPaymentSuccessTone() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const compressor = ctx.createDynamicsCompressor();
      compressor.connect(ctx.destination);

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1318.51, now); // E6

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.95, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

      osc.connect(gain);
      gain.connect(compressor);

      osc.start(now);
      osc.stop(now + 0.9);

      this.vibrate([200, 80, 200]);
    } catch (e) {
      // Ignore
    }
  }

  /**
   * Warning Tone.
   */
  public playWarningTone() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.5, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);

      this.vibrate([300]);
    } catch (e) {
      // Ignore
    }
  }

  /**
   * Tactile vibration.
   */
  public vibrate(pattern: number | number[]) {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Not supported or blocked
      }
    }
  }
}

export const feedback = new FeedbackManager();
