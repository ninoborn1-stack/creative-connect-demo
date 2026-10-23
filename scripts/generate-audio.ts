// Erzeugt kurze Demo-Hörproben (Akkorde als Sinus-Mix) als WAV in public/demo-audio/.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SAMPLE_RATE = 22050;
const CHORDS = [
  [220, 277.18, 329.63], [196, 246.94, 293.66], [174.61, 220, 261.63], [164.81, 207.65, 246.94],
  [146.83, 185, 220], [130.81, 164.81, 196], [233.08, 293.66, 349.23], [207.65, 261.63, 311.13],
];

function wav(seconds: number, progression: number[][], bpm: number) {
  const n = Math.floor(seconds * SAMPLE_RATE);
  const data = Buffer.alloc(44 + n * 2);
  data.write("RIFF", 0); data.writeUInt32LE(36 + n * 2, 4); data.write("WAVE", 8); data.write("fmt ", 12);
  data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(1, 22); data.writeUInt32LE(SAMPLE_RATE, 24);
  data.writeUInt32LE(SAMPLE_RATE * 2, 28); data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34); data.write("data", 36); data.writeUInt32LE(n * 2, 40);
  const beat = (60 / bpm) * SAMPLE_RATE;
  const chordLen = n / progression.length;
  for (let i = 0; i < n; i++) {
    const chord = progression[Math.min(progression.length - 1, Math.floor(i / chordLen))];
    const t = i / SAMPLE_RATE;
    let v = chord.reduce((acc, f) => acc + Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(4 * Math.PI * f * t), 0) / (chord.length * 1.6);
    const pulse = Math.exp(-((i % beat) / beat) * 6); // rhythmischer Puls
    const kick = Math.sin(2 * Math.PI * 55 * t) * Math.exp(-((i % beat) / SAMPLE_RATE) * 18);
    v = v * (0.35 + 0.45 * pulse) + kick * 0.5;
    const fade = Math.min(1, i / (SAMPLE_RATE * 0.2), (n - i) / (SAMPLE_RATE * 0.4));
    data.writeInt16LE(Math.max(-1, Math.min(1, v * fade * 0.8)) * 32767, 44 + i * 2);
  }
  return data;
}

export async function generateDemoAudio() {
  const dir = path.join(process.cwd(), "public", "demo-audio");
  await mkdir(dir, { recursive: true });
  for (let k = 0; k < 8; k++) {
    const progression = [0, 1, 2, 3].map((j) => CHORDS[(k + j * 2) % CHORDS.length]);
    await writeFile(path.join(dir, `demo-${k + 1}.wav`), wav(3 + (k % 6), progression, 80 + k * 8));
  }
}
