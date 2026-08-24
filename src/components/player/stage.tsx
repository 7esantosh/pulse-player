import type { RefObject } from "react";
import { FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PulseLogo } from "@/components/player/logo";
import { Visualizer } from "@/components/player/visualizer";
import { currentTrackOf, usePlayer } from "@/lib/player/store";
import { cn } from "@/lib/utils";

type StageProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
  onOpen: () => void;
};

export function Stage({ videoRef, onOpen }: StageProps) {
  const track = usePlayer(currentTrackOf);
  const playing = usePlayer((s) => s.playing);
  const fit = usePlayer((s) => s.fit);
  const rotate = usePlayer((s) => s.rotate);
  const mirror = usePlayer((s) => s.mirror);
  const brightness = usePlayer((s) => s.brightness);
  const contrast = usePlayer((s) => s.contrast);
  const saturation = usePlayer((s) => s.saturation);
  const visualizer = usePlayer((s) => s.visualizer);
  const subtitleUrl = usePlayer((s) => s.subtitleUrl);

  const isVideo = track?.kind === "video";
  const transform = [
    rotate ? `rotate(${rotate}deg)` : "",
    mirror ? "scaleX(-1)" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-bg">
      <video
        ref={videoRef}
        className={cn(
          "h-full w-full bg-bg",
          isVideo ? "block" : "pointer-events-none absolute h-px w-px opacity-0",
          fit === "cover" ? "object-cover" : "object-contain",
        )}
        style={{
          transform: transform || undefined,
          filter: `brightness(${brightness}) contrast(${contrast}) saturate(${saturation})`,
        }}
        playsInline
        preload="auto"
      >
        {subtitleUrl ? (
          <track kind="subtitles" src={subtitleUrl} srcLang="en" label="Subtitles" default />
        ) : null}
      </video>

      {!isVideo && track ? (
        <div className="flex h-full w-full max-w-2xl flex-col items-center justify-center gap-6 px-6">
          <PulseLogo className="size-16 text-accent" />
          <div className="text-center">
            <p className="text-lg font-medium tracking-tight text-fg">{track.name}</p>
            <p className="mt-1 text-sm text-muted">Audio</p>
          </div>
          {visualizer ? (
            <div className="h-36 w-full">
              <Visualizer active={playing} />
            </div>
          ) : null}
        </div>
      ) : null}

      {!track ? (
        <div className="flex flex-col items-center gap-5 px-6 text-center">
          <PulseLogo className="size-16" />
          <div>
            <p className="text-lg font-medium tracking-tight">Drop files here</p>
            <p className="mt-1 max-w-sm text-sm text-muted">
              Video and audio stay on this device. Nothing is uploaded.
            </p>
          </div>
          <Button type="button" onClick={onOpen}>
            <FolderOpen className="size-4" />
            Open files
          </Button>
        </div>
      ) : null}
    </div>
  );
}
