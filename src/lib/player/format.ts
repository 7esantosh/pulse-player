import { AUDIO_EXT, VIDEO_EXT, type MediaKind } from "./types";

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function formatSize(bytes: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function kindFromName(name: string, mime = ""): MediaKind {
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (VIDEO_EXT.has(ext)) return "video";
  if (AUDIO_EXT.has(ext)) return "audio";
  return mime.startsWith("video") ? "video" : "audio";
}

export function isMediaFile(name: string, mime = ""): boolean {
  if (mime.startsWith("video/") || mime.startsWith("audio/")) return true;
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return VIDEO_EXT.has(ext) || AUDIO_EXT.has(ext);
}

export function rateLabel(rate: number): string {
  const rounded = Math.round(rate * 100) / 100;
  return `${rounded}x`;
}
