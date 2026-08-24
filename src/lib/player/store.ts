import { create } from "zustand";
import {
  DEFAULT_SETTINGS,
  type PlayerSettings,
  type RepeatMode,
  type Track,
} from "./types";

const SETTINGS_KEY = "pulse-settings-v1";
const POSITIONS_KEY = "pulse-positions-v1";

export type PlayerState = PlayerSettings & {
  tracks: Track[];
  currentId: string | null;
  playing: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  playlistOpen: boolean;
  settingsOpen: boolean;
  sleepUntil: number | null;
  loopA: number | null;
  loopB: number | null;
  subtitleUrl: string | null;
  query: string;
  toast: string | null;
  hydrated: boolean;
};

type PlayerActions = {
  hydrate: () => void;
  persistSettings: () => void;
  addFiles: (files: File[]) => void;
  removeTrack: (id: string) => void;
  clearPlaylist: () => void;
  selectTrack: (id: string) => void;
  playTrack: (id: string) => void;
  setPlaying: (playing: boolean) => void;
  setTimes: (partial: {
    currentTime?: number;
    duration?: number;
    buffered?: number;
  }) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setRate: (rate: number) => void;
  cycleRate: () => void;
  cycleRepeat: () => void;
  toggleShuffle: () => void;
  toggleRemaining: () => void;
  setFit: (fit: PlayerSettings["fit"]) => void;
  cycleRotate: () => void;
  toggleMirror: () => void;
  setVideoFilter: (
    key: "brightness" | "contrast" | "saturation",
    value: number,
  ) => void;
  setEq: (key: keyof PlayerSettings["eq"], value: number) => void;
  resetEq: () => void;
  toggleVisualizer: () => void;
  setSkipSeconds: (skip: PlayerSettings["skipSeconds"]) => void;
  togglePlaylist: () => void;
  toggleSettings: () => void;
  setQuery: (query: string) => void;
  setSleep: (minutes: number | null) => void;
  setLoopPoint: (which: "a" | "b") => void;
  clearLoop: () => void;
  setSubtitleUrl: (url: string | null) => void;
  moveTrack: (id: string, dir: -1 | 1) => void;
  nextId: () => string | null;
  prevId: () => string | null;
  showToast: (toast: string) => void;
  rememberPosition: (id: string, time: number) => void;
  recalledPosition: (track: Track) => number;
};

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const REPEATS: RepeatMode[] = ["off", "all", "one"];

function pickNeighbor(
  tracks: Track[],
  currentId: string | null,
  dir: 1 | -1,
  shuffle: boolean,
  repeat: RepeatMode,
): string | null {
  if (tracks.length === 0) return null;
  if (shuffle && tracks.length > 1) {
    const others = tracks.filter((t) => t.id !== currentId);
    return others[Math.floor(Math.random() * others.length)]?.id ?? currentId;
  }
  const idx = tracks.findIndex((t) => t.id === currentId);
  if (idx < 0) return tracks[0]?.id ?? null;
  const next = idx + dir;
  if (next >= 0 && next < tracks.length) return tracks[next].id;
  if (repeat === "all") {
    return dir === 1 ? tracks[0].id : tracks[tracks.length - 1].id;
  }
  return null;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const usePlayer = create<PlayerState & PlayerActions>((set, get) => ({
  ...DEFAULT_SETTINGS,
  tracks: [],
  currentId: null,
  playing: false,
  currentTime: 0,
  duration: 0,
  buffered: 0,
  playlistOpen: false,
  settingsOpen: false,
  sleepUntil: null,
  loopA: null,
  loopB: null,
  subtitleUrl: null,
  query: "",
  toast: null,
  hydrated: false,

  hydrate: () => {
    const saved = readJson<Partial<PlayerSettings>>(SETTINGS_KEY, {});
    set({ ...DEFAULT_SETTINGS, ...saved, hydrated: true });
  },

  persistSettings: () => {
    if (typeof window === "undefined") return;
    const s = get();
    const payload: PlayerSettings = {
      volume: s.volume,
      muted: s.muted,
      rate: s.rate,
      repeat: s.repeat,
      shuffle: s.shuffle,
      showRemaining: s.showRemaining,
      fit: s.fit,
      rotate: s.rotate,
      mirror: s.mirror,
      brightness: s.brightness,
      contrast: s.contrast,
      saturation: s.saturation,
      eq: s.eq,
      visualizer: s.visualizer,
      skipSeconds: s.skipSeconds,
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(payload));
  },

  addFiles: (files) => {
    const tracks: Track[] = [];
    for (const file of files) {
      const url = URL.createObjectURL(file);
      tracks.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        kind: file.type.startsWith("video/")
          ? "video"
          : file.type.startsWith("audio/")
            ? "audio"
            : file.name.match(/\.(mp4|webm|ogv|mov|mkv|m4v|avi|3gp)$/i)
              ? "video"
              : "audio",
        url,
        size: file.size,
        duration: 0,
      });
    }
    if (tracks.length === 0) return;
    set((s) => ({
      tracks: [...s.tracks, ...tracks],
      currentId: s.currentId ?? tracks[0]?.id ?? null,
      playing: s.currentId ? s.playing : true,
    }));
    get().showToast(
      tracks.length === 1 ? "Added 1 file" : `Added ${tracks.length} files`,
    );
  },

  removeTrack: (id) => {
    const { tracks, currentId } = get();
    const track = tracks.find((t) => t.id === id);
    if (track && !track.isSample) URL.revokeObjectURL(track.url);
    const next = tracks.filter((t) => t.id !== id);
    const nextId = currentId === id ? (next[0]?.id ?? null) : currentId;
    set({ tracks: next, currentId: nextId, playing: nextId ? get().playing : false });
  },

  clearPlaylist: () => {
    for (const t of get().tracks) {
      if (!t.isSample) URL.revokeObjectURL(t.url);
    }
    const sub = get().subtitleUrl;
    if (sub) URL.revokeObjectURL(sub);
    set({
      tracks: [],
      currentId: null,
      playing: false,
      currentTime: 0,
      duration: 0,
      subtitleUrl: null,
      loopA: null,
      loopB: null,
    });
  },

  selectTrack: (id) => {
    if (get().currentId === id) {
      set({ playing: !get().playing });
      return;
    }
    get().playTrack(id);
  },

  playTrack: (id) => {
    set({
      currentId: id,
      playing: true,
      currentTime: 0,
      loopA: null,
      loopB: null,
    });
  },

  setPlaying: (playing) => set({ playing }),
  setTimes: (partial) => set(partial),
  setVolume: (volume) => set({ volume, muted: volume === 0 }),
  toggleMute: () => set((s) => ({ muted: !s.muted })),
  setRate: (rate) => set({ rate }),
  cycleRate: () => {
    const { rate } = get();
    const i = RATES.findIndex((r) => Math.abs(r - rate) < 0.01);
    set({ rate: RATES[(i + 1) % RATES.length] ?? 1 });
  },
  cycleRepeat: () => {
    const { repeat } = get();
    const i = REPEATS.indexOf(repeat);
    set({ repeat: REPEATS[(i + 1) % REPEATS.length] ?? "off" });
  },
  toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),
  toggleRemaining: () => set((s) => ({ showRemaining: !s.showRemaining })),
  setFit: (fit) => set({ fit }),
  cycleRotate: () =>
    set((s) => ({
      rotate: ((s.rotate + 90) % 360) as PlayerSettings["rotate"],
    })),
  toggleMirror: () => set((s) => ({ mirror: !s.mirror })),
  setVideoFilter: (key, value) => set({ [key]: value }),
  setEq: (key, value) => set((s) => ({ eq: { ...s.eq, [key]: value } })),
  resetEq: () => set({ eq: { bass: 0, mid: 0, treble: 0 } }),
  toggleVisualizer: () => set((s) => ({ visualizer: !s.visualizer })),
  setSkipSeconds: (skipSeconds) => set({ skipSeconds }),
  togglePlaylist: () =>
    set((s) => ({ playlistOpen: !s.playlistOpen, settingsOpen: false })),
  toggleSettings: () => set((s) => ({ settingsOpen: !s.settingsOpen })),
  setQuery: (query) => set({ query }),
  setSleep: (minutes) => {
    if (minutes == null) {
      set({ sleepUntil: null });
      get().showToast("Sleep timer off");
      return;
    }
    set({ sleepUntil: Date.now() + minutes * 60_000 });
    get().showToast(`Sleep in ${minutes} min`);
  },
  setLoopPoint: (which) => {
    const t = get().currentTime;
    if (which === "a") {
      set({ loopA: t });
      get().showToast("Loop A set");
    } else {
      set({ loopB: t });
      get().showToast("Loop B set");
    }
  },
  clearLoop: () => set({ loopA: null, loopB: null }),
  setSubtitleUrl: (url) => {
    const prev = get().subtitleUrl;
    if (prev) URL.revokeObjectURL(prev);
    set({ subtitleUrl: url });
  },
  moveTrack: (id, dir) => {
    const tracks = [...get().tracks];
    const i = tracks.findIndex((t) => t.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= tracks.length) return;
    const a = tracks[i];
    const b = tracks[j];
    if (!a || !b) return;
    tracks[i] = b;
    tracks[j] = a;
    set({ tracks });
  },
  nextId: () => {
    const { tracks, currentId, shuffle, repeat } = get();
    if (repeat === "one" && currentId) return currentId;
    return pickNeighbor(tracks, currentId, 1, shuffle, repeat);
  },
  prevId: () => {
    const { tracks, currentId, shuffle, repeat } = get();
    return pickNeighbor(tracks, currentId, -1, shuffle, repeat);
  },
  showToast: (toast) => {
    set({ toast });
    window.setTimeout(() => {
      if (get().toast === toast) set({ toast: null });
    }, 2200);
  },
  rememberPosition: (id, time) => {
    if (typeof window === "undefined" || time < 2) return;
    const map = readJson<Record<string, number>>(POSITIONS_KEY, {});
    map[id] = time;
    localStorage.setItem(POSITIONS_KEY, JSON.stringify(map));
  },
  recalledPosition: (track) => {
    const map = readJson<Record<string, number>>(POSITIONS_KEY, {});
    return map[track.id] ?? 0;
  },
}));

export function currentTrackOf(s: PlayerState): Track | undefined {
  return s.tracks.find((t) => t.id === s.currentId);
}
