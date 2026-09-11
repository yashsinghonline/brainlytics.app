"use client";

let ctx: AudioContext | null = null;
let enabled = true;
let hapticsOn = true;

export function configureAudio(sound: boolean, haptics: boolean) {
  enabled = sound;
  hapticsOn = haptics;
}

function audio(): AudioContext | null {
  if (typeof window === "undefined" || !enabled) return null;
  try {
    if (!ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, duration: number, type: OscillatorType, gain = 0.14) {
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const vol = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime + start);
  vol.gain.setValueAtTime(0.0001, ac.currentTime + start);
  vol.gain.exponentialRampToValueAtTime(gain, ac.currentTime + start + 0.012);
  vol.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + duration);
  osc.connect(vol).connect(ac.destination);
  osc.start(ac.currentTime + start);
  osc.stop(ac.currentTime + start + duration + 0.02);
}

export const sfx = {
  tap() {
    tone(420, 0, 0.05, "sine", 0.06);
  },
  correct() {
    tone(660, 0, 0.09, "sine", 0.12);
    tone(990, 0.06, 0.1, "sine", 0.1);
  },
  wrong() {
    tone(190, 0, 0.16, "square", 0.08);
  },
  combo(level: number) {
    const base = 620 + Math.min(level, 8) * 60;
    tone(base, 0, 0.07, "triangle", 0.1);
    tone(base * 1.25, 0.06, 0.08, "triangle", 0.09);
    tone(base * 1.5, 0.12, 0.1, "triangle", 0.08);
  },
  countdown(final: boolean) {
    tone(final ? 900 : 560, 0, final ? 0.22 : 0.1, "triangle", 0.12);
  },
  finish() {
    tone(520, 0, 0.14, "sine", 0.12);
    tone(660, 0.12, 0.14, "sine", 0.12);
    tone(880, 0.24, 0.24, "sine", 0.12);
  },
  achievement() {
    tone(880, 0, 0.1, "triangle", 0.1);
    tone(1180, 0.09, 0.12, "triangle", 0.09);
    tone(1480, 0.19, 0.2, "triangle", 0.08);
  },
};

export function buzz(pattern: number | number[]) {
  if (!hapticsOn || typeof navigator === "undefined") return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* ignore */
  }
}
