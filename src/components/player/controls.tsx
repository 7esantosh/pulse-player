import { useState } from "react";
import {
  Maximize, Minimize, Pause, PictureInPicture2, Play,
  Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume2, VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Hint } from "@/components/ui/tooltip";
import { formatTime, rateLabel } from "@/lib/player/format";
import { currentTrackOf, usePlayer } from "@/lib/player/store";
import { cn } from "@/lib/utils";

type ControlsProps = {
  onSeek: (time: number) => void;
  onSkip: (dir: -1 | 1) => void;
  onPrev: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
  onFullscreen: () => void;
  onPip: () => void;
  fullscreen: boolean;
};

export function Controls({
  onSeek, onSkip, onPrev, onNext, onTogglePlay, onFullscreen, onPip, fullscreen,
}: ControlsProps) {
  const playing = usePlayer((s) => s.playing);
  const currentTime = usePlayer((s) => s.currentTime);
  const duration = usePlayer((s) => s.duration);
  const volume = usePlayer((s) => s.volume);
  const muted = usePlayer((s) => s.muted);
  const rate = usePlayer((s) => s.rate);
  const repeat = usePlayer((s) => s.repeat);
  const shuffle = usePlayer((s) => s.shuffle);
  const showRemaining = usePlayer((s) => s.showRemaining);
  const skipSeconds = usePlayer((s) => s.skipSeconds);
  const track = usePlayer(currentTrackOf);
  const setVolume = usePlayer((s) => s.setVolume);
  const toggleMute = usePlayer((s) => s.toggleMute);
  const cycleRate = usePlayer((s) => s.cycleRate);
  const cycleRepeat = usePlayer((s) => s.cycleRepeat);
  const toggleShuffle = usePlayer((s) => s.toggleShuffle);
  const toggleRemaining = usePlayer((s) => s.toggleRemaining);

  const [scrub, setScrub] = useState<number | null>(null);
  const shown = scrub ?? currentTime;
  const max = duration > 0 ? duration : 1;

  return (
    <div className="border-t border-border bg-surface px-3 py-2 sm:px-4">
      <div className="flex items-center gap-3">
        <button type="button" onClick={toggleRemaining} className="w-12 shrink-0 text-left text-xs tabular-nums text-muted">
          {formatTime(shown)}
        </button>
        <Slider value={shown} min={0} max={max} step={0.1}
          onValueChange={setScrub}
          onValueCommit={(v) => { onSeek(v); setScrub(null); }}
          ariaLabel="Seek" className="flex-1" />
        <button type="button" onClick={toggleRemaining} className="w-12 shrink-0 text-right text-xs tabular-nums text-muted">
          {showRemaining && duration ? `-${formatTime(Math.max(0, duration - shown))}` : formatTime(duration)}
        </button>
      </div>

      <div className="mt-1 flex items-center justify-between gap-2">
        <div className="flex items-center">
          <Hint label="Previous">
            <Button type="button" variant="ghost" size="icon" aria-label="Previous" onClick={onPrev}>
              <SkipBack className="size-5" />
            </Button>
          </Hint>
          <Hint label={playing ? "Pause" : "Play"}>
            <Button type="button" variant="ghost" size="icon" aria-label={playing ? "Pause" : "Play"} onClick={onTogglePlay} className="size-12">
              {playing ? <Pause className="size-6 fill-fg" /> : <Play className="size-6 fill-fg" />}
            </Button>
          </Hint>
          <Hint label="Next">
            <Button type="button" variant="ghost" size="icon" aria-label="Next" onClick={onNext}>
              <SkipForward className="size-5" />
            </Button>
          </Hint>
          <button type="button" onClick={() => onSkip(1)} className="hidden h-11 px-2 text-xs text-muted hover:text-fg sm:inline">
            +{skipSeconds}
          </button>
        </div>

        <p className="hidden min-w-0 flex-1 truncate px-2 text-center text-sm text-muted md:block">
          {track?.name ?? "No file"}
        </p>

        <div className="flex items-center">
          <div className="hidden items-center sm:flex">
            <Hint label={muted ? "Unmute" : "Mute"}>
              <Button type="button" variant="ghost" size="iconSm" aria-label={muted ? "Unmute" : "Mute"} onClick={toggleMute}>
                {muted || volume === 0 ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              </Button>
            </Hint>
            <Slider value={muted ? 0 : volume} min={0} max={1} step={0.01} onValueChange={setVolume} ariaLabel="Volume" className="w-24" />
          </div>
          <Hint label="Speed">
            <Button type="button" variant="ghost" size="sm" onClick={cycleRate} aria-label="Playback speed" className="w-12 tabular-nums">
              {rateLabel(rate)}
            </Button>
          </Hint>
          <Hint label={repeat === "one" ? "Repeat one" : repeat === "all" ? "Repeat all" : "Repeat off"}>
            <Button type="button" variant="ghost" size="iconSm" onClick={cycleRepeat} aria-label="Repeat" className={cn(repeat !== "off" && "text-accent")}>
              {repeat === "one" ? <Repeat1 className="size-4" /> : <Repeat className="size-4" />}
            </Button>
          </Hint>
          <Hint label="Shuffle">
            <Button type="button" variant="ghost" size="iconSm" onClick={toggleShuffle} aria-label="Shuffle" className={cn(shuffle && "text-accent")}>
              <Shuffle className="size-4" />
            </Button>
          </Hint>
          <Hint label="Picture in picture">
            <Button type="button" variant="ghost" size="iconSm" onClick={onPip} aria-label="Picture in picture" className="hidden sm:inline-flex">
              <PictureInPicture2 className="size-4" />
            </Button>
          </Hint>
          <Hint label={fullscreen ? "Exit fullscreen" : "Fullscreen"}>
            <Button type="button" variant="ghost" size="iconSm" onClick={onFullscreen} aria-label="Fullscreen">
              {fullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
            </Button>
          </Hint>
        </div>
      </div>
    </div>
  );
}
