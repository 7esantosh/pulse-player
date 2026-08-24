type AudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

let ctx: AudioContext | null = null;
let source: MediaElementAudioSourceNode | null = null;
let analyser: AnalyserNode | null = null;
let bass: BiquadFilterNode | null = null;
let mid: BiquadFilterNode | null = null;
let treble: BiquadFilterNode | null = null;
let connectedEl: HTMLMediaElement | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  const AC = window.AudioContext || (window as AudioWindow).webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  return ctx;
}

export function attachAudioGraph(el: HTMLMediaElement): AnalyserNode | null {
  if (connectedEl === el && analyser) return analyser;
  const audio = getContext();
  if (!audio) return null;
  try {
    source = audio.createMediaElementSource(el);
    bass = audio.createBiquadFilter();
    bass.type = "lowshelf";
    bass.frequency.value = 250;
    mid = audio.createBiquadFilter();
    mid.type = "peaking";
    mid.frequency.value = 1000;
    mid.Q.value = 0.9;
    treble = audio.createBiquadFilter();
    treble.type = "highshelf";
    treble.frequency.value = 4000;
    analyser = audio.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.82;
    source.connect(bass);
    bass.connect(mid);
    mid.connect(treble);
    treble.connect(analyser);
    analyser.connect(audio.destination);
    connectedEl = el;
  } catch {
    // Already connected in this session.
  }
  return analyser;
}

export function setEqGains(next: { bass: number; mid: number; treble: number }) {
  if (bass) bass.gain.value = next.bass;
  if (mid) mid.gain.value = next.mid;
  if (treble) treble.gain.value = next.treble;
}

export async function resumeAudio() {
  const audio = getContext();
  if (audio && audio.state === "suspended") {
    await audio.resume();
  }
}

export function getAnalyser() {
  return analyser;
}
