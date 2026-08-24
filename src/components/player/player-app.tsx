import { useCallback, useEffect, useRef, useState } from "react";
import { FolderOpen, HelpCircle, ListMusic, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hint, TooltipProvider } from "@/components/ui/tooltip";
import { Controls } from "@/components/player/controls";
import { PulseLogo } from "@/components/player/logo";
import { PlaylistPanel } from "@/components/player/playlist-panel";
import { SettingsPanel } from "@/components/player/settings-panel";
import { Stage } from "@/components/player/stage";
import { attachAudioGraph, resumeAudio, setEqGains } from "@/lib/player/audio-graph";
import { isMediaFile } from "@/lib/player/format";
import { srtToVtt } from "@/lib/player/srt";
import { currentTrackOf, usePlayer } from "@/lib/player/store";
import { cn } from "@/lib/utils";

export function PlayerApp() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);
  const subRef = useRef<HTMLInputElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [dragging, setDragging] = useState(false);

  const hydrate = usePlayer((s) => s.hydrate);
  const persistSettings = usePlayer((s) => s.persistSettings);
  const addFiles = usePlayer((s) => s.addFiles);
  const playTrack = usePlayer((s) => s.playTrack);
  const setPlaying = usePlayer((s) => s.setPlaying);
  const setTimes = usePlayer((s) => s.setTimes);
  const setVolume = usePlayer((s) => s.setVolume);
  const toggleMute = usePlayer((s) => s.toggleMute);
  const setRate = usePlayer((s) => s.setRate);
  const cycleRepeat = usePlayer((s) => s.cycleRepeat);
  const toggleShuffle = usePlayer((s) => s.toggleShuffle);
  const toggleRemaining = usePlayer((s) => s.toggleRemaining);
  const togglePlaylist = usePlayer((s) => s.togglePlaylist);
  const toggleSettings = usePlayer((s) => s.toggleSettings);
  const nextId = usePlayer((s) => s.nextId);
  const prevId = usePlayer((s) => s.prevId);
  const showToast = usePlayer((s) => s.showToast);
  const rememberPosition = usePlayer((s) => s.rememberPosition);
  const recalledPosition = usePlayer((s) => s.recalledPosition);
  const setSubtitleUrl = usePlayer((s) => s.setSubtitleUrl);

  const track = usePlayer(currentTrackOf);
  const playing = usePlayer((s) => s.playing);
  const volume = usePlayer((s) => s.volume);
  const muted = usePlayer((s) => s.muted);
  const rate = usePlayer((s) => s.rate);
  const skipSeconds = usePlayer((s) => s.skipSeconds);
  const playlistOpen = usePlayer((s) => s.playlistOpen);
  const settingsOpen = usePlayer((s) => s.settingsOpen);
  const hydrated = usePlayer((s) => s.hydrated);
  const toast = usePlayer((s) => s.toast);
  const eq = usePlayer((s) => s.eq);
  const loopA = usePlayer((s) => s.loopA);
  const loopB = usePlayer((s) => s.loopB);
  const sleepUntil = usePlayer((s) => s.sleepUntil);
  const currentId = usePlayer((s) => s.currentId);
  const repeat = usePlayer((s) => s.repeat);

  useEffect(() => {
    hydrate();
    if (window.innerWidth >= 768) {
      usePlayer.setState({ playlistOpen: true });
    }
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    persistSettings();
  }, [hydrated, persistSettings, volume, muted, rate, skipSeconds, eq]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    attachAudioGraph(el);
  }, []);

  useEffect(() => {
    setEqGains(eq);
  }, [eq]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !track) return;
    el.src = track.url;
    const saved = recalledPosition(track);
    const apply = () => {
      if (saved > 2 && saved < (el.duration || Infinity) - 2) {
        el.currentTime = saved;
      } else if (el.currentTime === 0) {
        el.currentTime = 0.04;
      }
      if (usePlayer.getState().playing) {
        void el.play().catch(() => setPlaying(false));
      }
    };
    if (el.readyState >= 1) apply();
    else el.addEventListener("loadedmetadata", apply, { once: true });
  }, [track?.id, recalledPosition, setPlaying]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.volume = volume;
    el.muted = muted;
    el.playbackRate = rate;
  }, [volume, muted, rate]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (playing) {
      void resumeAudio();
      void el.play().catch(() => setPlaying(false));
    } else {
      el.pause();
    }
  }, [playing, setPlaying]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const onTime = () => {
      const buffered =
        el.buffered.length > 0 ? el.buffered.end(el.buffered.length - 1) : 0;
      setTimes({
        currentTime: el.currentTime,
        duration: Number.isFinite(el.duration) ? el.duration : 0,
        buffered,
      });
      if (loopA != null && loopB != null && loopB > loopA && el.currentTime >= loopB) {
        el.currentTime = loopA;
      }
    };
    const onMeta = () => {
      setTimes({ duration: Number.isFinite(el.duration) ? el.duration : 0 });
      if (track) {
        usePlayer.setState((s) => ({
          tracks: s.tracks.map((t) =>
            t.id === track.id
              ? { ...t, duration: Number.isFinite(el.duration) ? el.duration : t.duration }
              : t,
          ),
        }));
      }
    };
    const onEnded = () => {
      if (repeat === "one") {
        el.currentTime = 0;
        void el.play();
        return;
      }
      const id = nextId();
      if (id) playTrack(id);
      else setPlaying(false);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => {
      if (!el.ended) setPlaying(false);
    };
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("progress", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("ended", onEnded);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("progress", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
    };
  }, [loopA, loopB, nextId, playTrack, setPlaying, setTimes, track, currentId, repeat]);

  useEffect(() => {
    if (!playing || !currentId) return;
    const id = window.setInterval(() => {
      const el = videoRef.current;
      if (el) rememberPosition(currentId, el.currentTime);
    }, 4000);
    return () => window.clearInterval(id);
  }, [playing, currentId, rememberPosition]);

  useEffect(() => {
    if (!sleepUntil) return;
    const ms = sleepUntil - Date.now();
    if (ms <= 0) {
      setPlaying(false);
      usePlayer.getState().setSleep(null);
      return;
    }
    const id = window.setTimeout(() => {
      setPlaying(false);
      usePlayer.getState().setSleep(null);
      showToast("Sleep timer ended");
    }, ms);
    return () => window.clearTimeout(id);
  }, [sleepUntil, setPlaying, showToast]);

  useEffect(() => {
    if (!playing || !navigator.wakeLock) return;
    let lock: WakeLockSentinel | null = null;
    void navigator.wakeLock.request("screen").then((l) => { lock = l; }).catch(() => {});
    return () => { void lock?.release(); };
  }, [playing]);

  const skip = useCallback(
    (dir: -1 | 1) => {
      const el = videoRef.current;
      if (!el) return;
      el.currentTime = Math.min(
        el.duration || el.currentTime,
        Math.max(0, el.currentTime + dir * skipSeconds),
      );
    },
    [skipSeconds],
  );

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = track
      ? new MediaMetadata({ title: track.name, artist: "Pulse", album: "Local files" })
      : null;
    navigator.mediaSession.playbackState = playing ? "playing" : "paused";
    navigator.mediaSession.setActionHandler("play", () => setPlaying(true));
    navigator.mediaSession.setActionHandler("pause", () => setPlaying(false));
    navigator.mediaSession.setActionHandler("previoustrack", () => {
      const id = prevId();
      if (id) playTrack(id);
    });
    navigator.mediaSession.setActionHandler("nexttrack", () => {
      const id = nextId();
      if (id) playTrack(id);
    });
    navigator.mediaSession.setActionHandler("seekbackward", () => skip(-1));
    navigator.mediaSession.setActionHandler("seekforward", () => skip(1));
  }, [track, playing, setPlaying, prevId, nextId, playTrack, skip]);

  const seek = useCallback((time: number) => {
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = time;
    setTimes({ currentTime: time });
  }, [setTimes]);

  const togglePlay = useCallback(() => {
    setPlaying(!usePlayer.getState().playing);
  }, [setPlaying]);

  const goNext = useCallback(() => {
    const id = nextId();
    if (id && id === usePlayer.getState().currentId) {
      const el = videoRef.current;
      if (el) { el.currentTime = 0; void el.play(); }
      setPlaying(true);
      return;
    }
    if (id) playTrack(id);
    else skip(1);
  }, [nextId, playTrack, skip, setPlaying]);

  const goPrev = useCallback(() => {
    const el = videoRef.current;
    if (el && el.currentTime > 3) {
      el.currentTime = 0;
      return;
    }
    const id = prevId();
    if (id) playTrack(id);
    else skip(-1);
  }, [prevId, playTrack, skip]);

  const onFullscreen = useCallback(() => {
    const node = rootRef.current;
    if (!node) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void node.requestFullscreen();
  }, []);

  const onPip = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (document.pictureInPictureElement) {
      void document.exitPictureInPicture();
    } else if (el.requestPictureInPicture) {
      void el.requestPictureInPicture().catch(() => showToast("Picture in picture unavailable"));
    }
  }, [showToast]);

  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const ingest = useCallback(
    (list: FileList | File[] | null) => {
      if (!list) return;
      const files = Array.from(list).filter((f) => isMediaFile(f.name, f.type));
      if (files.length === 0) {
        showToast("No audio or video files");
        return;
      }
      addFiles(files);
    },
    [addFiles, showToast],
  );

  const onPickSubtitles = useCallback(() => { subRef.current?.click(); }, []);

  const onScreenshot = useCallback(() => {
    const el = videoRef.current;
    if (!el || !el.videoWidth) {
      showToast("No video frame");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = el.videoWidth;
    canvas.height = el.videoHeight;
    canvas.getContext("2d")?.drawImage(el, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "pulse-frame.png";
      a.click();
      URL.revokeObjectURL(a.href);
      showToast("Saved screenshot");
    });
  }, [showToast]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const el = videoRef.current;
      switch (e.key) {
        case " ":
        case "k":
        case "K":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (el) el.currentTime = Math.max(0, el.currentTime - 5);
          break;
        case "ArrowRight":
          e.preventDefault();
          if (el) el.currentTime = Math.min(el.duration || 0, el.currentTime + 5);
          break;
        case "j":
        case "J":
          skip(-1);
          break;
        case "l":
        case "L":
          skip(1);
          break;
        case "ArrowUp":
          e.preventDefault();
          setVolume(Math.min(1, usePlayer.getState().volume + 0.05));
          break;
        case "ArrowDown":
          e.preventDefault();
          setVolume(Math.max(0, usePlayer.getState().volume - 0.05));
          break;
        case "m":
        case "M":
          toggleMute();
          break;
        case "f":
        case "F":
          onFullscreen();
          break;
        case "i":
        case "I":
          onPip();
          break;
        case "n":
        case "N":
          goNext();
          break;
        case "p":
        case "P":
          goPrev();
          break;
        case "[":
          setRate(Math.max(0.25, Math.round((usePlayer.getState().rate - 0.25) * 100) / 100));
          break;
        case "]":
          setRate(Math.min(2, Math.round((usePlayer.getState().rate + 0.25) * 100) / 100));
          break;
        case "r":
        case "R":
          cycleRepeat();
          break;
        case "s":
        case "S":
          toggleShuffle();
          break;
        case "t":
        case "T":
          toggleRemaining();
          break;
        case "?":
          toggleSettings();
          break;
        case "Escape":
          if (document.fullscreenElement) void document.exitFullscreen();
          else if (settingsOpen) toggleSettings();
          break;
        default:
          if (/^[0-9]$/.test(e.key) && el && el.duration) {
            el.currentTime = (el.duration * Number(e.key)) / 10;
          }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    cycleRepeat, goNext, goPrev, onFullscreen, onPip, setRate, setVolume,
    settingsOpen, skip, toggleMute, togglePlay, toggleRemaining, toggleSettings, toggleShuffle,
  ]);

  return (
    <TooltipProvider>
      <div
        ref={rootRef}
        className={cn("flex h-svh flex-col bg-bg text-fg", dragging && "ring-2 ring-inset ring-accent/40")}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); ingest(e.dataTransfer.files); }}
      >
        <header className="flex items-center gap-2 border-b border-border px-3 py-2 sm:px-4">
          <PulseLogo className="size-7" />
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-medium tracking-tight">Pulse</h1>
            <p className="hidden text-xs text-muted sm:block">Local video & audio</p>
          </div>
          {toast ? <p className="truncate text-xs text-muted">{toast}</p> : null}
          <Hint label="Open files">
            <Button type="button" variant="subtle" size="sm" onClick={() => fileRef.current?.click()}>
              <FolderOpen className="size-4" />
              <span className="hidden sm:inline">Open</span>
            </Button>
          </Hint>
          <Hint label="Open folder">
            <Button type="button" variant="ghost" size="sm" onClick={() => folderRef.current?.click()} className="hidden sm:inline-flex">
              Folder
            </Button>
          </Hint>
          <Hint label="Playlist">
            <Button type="button" variant="ghost" size="iconSm" onClick={togglePlaylist} aria-label="Playlist" className={cn(playlistOpen && "text-accent")}>
              <ListMusic className="size-4" />
            </Button>
          </Hint>
          <Hint label="Settings">
            <Button type="button" variant="ghost" size="iconSm" onClick={toggleSettings} aria-label="Settings">
              <Settings className="size-4" />
            </Button>
          </Hint>
          <Hint label="Shortcuts">
            <Button type="button" variant="ghost" size="iconSm" onClick={toggleSettings} aria-label="Keyboard shortcuts" className="hidden sm:inline-flex">
              <HelpCircle className="size-4" />
            </Button>
          </Hint>
        </header>

        <div className="flex min-h-0 flex-1">
          <div className="relative flex min-w-0 flex-1 flex-col">
            <Stage videoRef={videoRef} onOpen={() => fileRef.current?.click()} />
            <Controls
              onSeek={seek}
              onSkip={skip}
              onPrev={goPrev}
              onNext={goNext}
              onTogglePlay={togglePlay}
              onFullscreen={onFullscreen}
              onPip={onPip}
              fullscreen={fullscreen}
            />
            {settingsOpen ? (
              <SettingsPanel onPickSubtitles={onPickSubtitles} onScreenshot={onScreenshot} />
            ) : null}
          </div>
          <div className={cn("max-md:absolute max-md:inset-0 max-md:z-10", playlistOpen ? "block" : "hidden")}>
            <PlaylistPanel />
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="audio/*,video/*,.mkv,.flac,.m4a,.aac,.mov,.avi,.webm,.ogg,.opus,.wav,.mp3,.mp4"
          multiple
          className="hidden"
          onChange={(e) => { ingest(e.target.files); e.target.value = ""; }}
        />
        <input
          ref={folderRef}
          type="file"
          // @ts-expect-error non-standard
          webkitdirectory=""
          multiple
          className="hidden"
          onChange={(e) => { ingest(e.target.files); e.target.value = ""; }}
        />
        <input
          ref={subRef}
          type="file"
          accept=".vtt,.srt,text/vtt"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            const text = await file.text();
            const vtt = file.name.endsWith(".srt") ? srtToVtt(text) : text;
            const url = URL.createObjectURL(new Blob([vtt], { type: "text/vtt" }));
            setSubtitleUrl(url);
            showToast("Subtitles loaded");
          }}
        />
      </div>
    </TooltipProvider>
  );
}
