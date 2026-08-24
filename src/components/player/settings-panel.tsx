import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { usePlayer } from "@/lib/player/store";
import { cn } from "@/lib/utils";

const SHORTCUTS = [
  ["Space / K", "Play / pause"],
  ["J / L", "Skip back / forward"],
  ["\u2190 / \u2192", "Skip 5 seconds"],
  ["\u2191 / \u2193", "Volume"],
  ["M", "Mute"],
  ["F", "Fullscreen"],
  ["I", "Picture in picture"],
  ["N / P", "Next / previous"],
  ["[ / ]", "Speed"],
  ["R", "Repeat"],
  ["S", "Shuffle"],
  ["0\u20139", "Jump 0\u201390%"],
  ["?", "Settings"],
];

export function SettingsPanel({
  onPickSubtitles,
  onScreenshot,
}: {
  onPickSubtitles: () => void;
  onScreenshot: () => void;
}) {
  const s = usePlayer();

  return (
    <div className="absolute inset-0 z-20 flex items-end justify-center bg-bg/70 p-3 sm:items-center" onClick={s.toggleSettings}>
      <div
        role="dialog"
        aria-labelledby="settings-title"
        className="flex max-h-[min(88vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-surface"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <h2 id="settings-title" className="flex-1 text-sm font-medium">Settings</h2>
          <Button type="button" variant="ghost" size="iconSm" onClick={s.toggleSettings} aria-label="Close settings">
            <X className="size-4" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4">
          <Section title="Playback">
            <Row label={`Speed ${s.rate}x`}>
              <Slider value={s.rate} min={0.25} max={2} step={0.05} onValueChange={s.setRate} ariaLabel="Speed" />
            </Row>
            <Row label="Skip">
              <div className="flex gap-1">
                {([5, 10, 15] as const).map((n) => (
                  <Chip key={n} active={s.skipSeconds === n} onClick={() => s.setSkipSeconds(n)}>{n}s</Chip>
                ))}
              </div>
            </Row>
          </Section>
          <Section title="Video">
            <Row label="Fit">
              <div className="flex gap-1">
                <Chip active={s.fit === "contain"} onClick={() => s.setFit("contain")}>Contain</Chip>
                <Chip active={s.fit === "cover"} onClick={() => s.setFit("cover")}>Cover</Chip>
              </div>
            </Row>
            <Row label="Rotate / mirror">
              <div className="flex gap-1">
                <Chip active={s.rotate !== 0} onClick={s.cycleRotate}>{s.rotate}\u00b0</Chip>
                <Chip active={s.mirror} onClick={s.toggleMirror}>Mirror</Chip>
              </div>
            </Row>
            <Row label="Brightness">
              <Slider value={s.brightness} min={0.4} max={1.6} step={0.05} onValueChange={(v) => s.setVideoFilter("brightness", v)} ariaLabel="Brightness" />
            </Row>
            <Row label="Contrast">
              <Slider value={s.contrast} min={0.4} max={1.6} step={0.05} onValueChange={(v) => s.setVideoFilter("contrast", v)} ariaLabel="Contrast" />
            </Row>
            <Row label="Saturation">
              <Slider value={s.saturation} min={0} max={2} step={0.05} onValueChange={(v) => s.setVideoFilter("saturation", v)} ariaLabel="Saturation" />
            </Row>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onPickSubtitles}>Load subtitles</Button>
              <Button type="button" variant="outline" size="sm" onClick={onScreenshot}>Save frame</Button>
            </div>
          </Section>
          <Section title="Audio">
            <Row label="Bass">
              <Slider value={s.eq.bass} min={-12} max={12} step={1} onValueChange={(v) => s.setEq("bass", v)} ariaLabel="Bass" />
            </Row>
            <Row label="Mid">
              <Slider value={s.eq.mid} min={-12} max={12} step={1} onValueChange={(v) => s.setEq("mid", v)} ariaLabel="Mid" />
            </Row>
            <Row label="Treble">
              <Slider value={s.eq.treble} min={-12} max={12} step={1} onValueChange={(v) => s.setEq("treble", v)} ariaLabel="Treble" />
            </Row>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={s.resetEq}>Reset EQ</Button>
              <Button type="button" variant={s.visualizer ? "subtle" : "outline"} size="sm" onClick={s.toggleVisualizer}>
                Visualizer {s.visualizer ? "on" : "off"}
              </Button>
            </div>
          </Section>
          <Section title="A\u2013B loop">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => s.setLoopPoint("a")}>Set A</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => s.setLoopPoint("b")}>Set B</Button>
              <Button type="button" variant="ghost" size="sm" onClick={s.clearLoop}>Clear</Button>
            </div>
            <p className="text-xs text-muted">
              {s.loopA == null && s.loopB == null ? "Off" : `A ${s.loopA?.toFixed(1) ?? "\u2014"} \u00b7 B ${s.loopB?.toFixed(1) ?? "\u2014"}`}
            </p>
          </Section>
          <Section title="Sleep timer">
            <div className="flex flex-wrap gap-1">
              {[5, 15, 30, 60].map((m) => (
                <Chip key={m} active={false} onClick={() => s.setSleep(m)}>{m}m</Chip>
              ))}
              <Chip active={s.sleepUntil == null} onClick={() => s.setSleep(null)}>Off</Chip>
            </div>
          </Section>
          <Section title="Keys">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              {SHORTCUTS.map(([key, action]) => (
                <div key={key} className="contents">
                  <dt className="font-mono text-xs text-muted">{key}</dt>
                  <dd className="text-fg">{action}</dd>
                </div>
              ))}
            </dl>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted">{title}</h3>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] items-center gap-3">
      <span className="text-sm text-muted">{label}</span>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 rounded-md px-3 text-xs font-medium",
        active ? "bg-accent text-accent-fg" : "bg-surface-2 text-fg hover:bg-border",
      )}
    >
      {children}
    </button>
  );
}
