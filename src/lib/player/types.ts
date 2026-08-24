export type MediaKind = "audio" | "video";
export type RepeatMode = "off" | "one" | "all";
export type FitMode = "contain" | "cover";

export type Track = {
  id: string;
  name: string;
  kind: MediaKind;
  url: string;
  size: number;
  duration: number;
  isSample?: boolean;
};

export type EqState = {
  bass: number;
  mid: number;
  treble: number;
};

export type PlayerSettings = {
  volume: number;
  muted: boolean;
  rate: number;
  repeat: RepeatMode;
  shuffle: boolean;
  showRemaining: boolean;
  fit: FitMode;
  rotate: 0 | 90 | 180 | 270;
  mirror: boolean;
  brightness: number;
  contrast: number;
  saturation: number;
  eq: EqState;
  visualizer: boolean;
  skipSeconds: 5 | 10 | 15;
};

export const DEFAULT_SETTINGS: PlayerSettings = {
  volume: 0.85,
  muted: false,
  rate: 1,
  repeat: "off",
  shuffle: false,
  showRemaining: false,
  fit: "contain",
  rotate: 0,
  mirror: false,
  brightness: 1,
  contrast: 1,
  saturation: 1,
  eq: { bass: 0, mid: 0, treble: 0 },
  visualizer: true,
  skipSeconds: 10,
};

export const VIDEO_EXT = new Set([
  "mp4", "webm", "ogv", "ogg", "mov", "mkv", "m4v", "avi", "3gp",
]);

export const AUDIO_EXT = new Set([
  "mp3", "wav", "flac", "m4a", "aac", "opus", "wma", "aiff", "oga",
]);
