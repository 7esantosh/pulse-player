import { ChevronDown, ChevronUp, ListMusic, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatSize, formatTime } from "@/lib/player/format";
import { usePlayer } from "@/lib/player/store";
import { cn } from "@/lib/utils";

export function PlaylistPanel() {
  const tracks = usePlayer((s) => s.tracks);
  const currentId = usePlayer((s) => s.currentId);
  const query = usePlayer((s) => s.query);
  const setQuery = usePlayer((s) => s.setQuery);
  const selectTrack = usePlayer((s) => s.selectTrack);
  const removeTrack = usePlayer((s) => s.removeTrack);
  const clearPlaylist = usePlayer((s) => s.clearPlaylist);
  const moveTrack = usePlayer((s) => s.moveTrack);
  const togglePlaylist = usePlayer((s) => s.togglePlaylist);

  const filtered = query.trim()
    ? tracks.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()))
    : tracks;

  return (
    <aside className="flex h-full w-full flex-col border-l border-border bg-surface md:w-80">
      <div className="flex items-center gap-2 border-b border-border px-3 py-3">
        <ListMusic className="size-4 text-muted" />
        <h2 className="flex-1 text-sm font-medium">Playlist</h2>
        <span className="text-xs tabular-nums text-muted">{tracks.length}</span>
        <Button type="button" variant="ghost" size="iconSm" onClick={togglePlaylist} aria-label="Close playlist" className="md:hidden">
          <X className="size-4" />
        </Button>
      </div>
      <div className="px-3 py-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter"
          className="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm text-fg placeholder:text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        />
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {filtered.length === 0 ? (
          <li className="px-2 py-8 text-center text-sm text-muted">No files</li>
        ) : (
          filtered.map((track) => {
            const active = track.id === currentId;
            return (
              <li key={track.id}>
                <div className={cn("group flex items-center gap-1 rounded-md px-1 py-1", active ? "bg-surface-2" : "hover:bg-surface-2/70")}>
                  <button type="button" onClick={() => selectTrack(track.id)} className="min-w-0 flex-1 rounded-sm px-2 py-2 text-left">
                    <p className={cn("truncate text-sm", active ? "text-fg" : "text-fg/90")}>{track.name}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {track.kind}
                      {track.duration ? ` · ${formatTime(track.duration)}` : ""}
                      {track.size ? ` · ${formatSize(track.size)}` : ""}
                    </p>
                  </button>
                  <div className="flex shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100">
                    <Button type="button" variant="ghost" size="iconSm" aria-label="Move up" onClick={() => moveTrack(track.id, -1)}>
                      <ChevronUp className="size-3.5" />
                    </Button>
                    <Button type="button" variant="ghost" size="iconSm" aria-label="Move down" onClick={() => moveTrack(track.id, 1)}>
                      <ChevronDown className="size-3.5" />
                    </Button>
                    <Button type="button" variant="ghost" size="iconSm" aria-label="Remove" onClick={() => removeTrack(track.id)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </li>
            );
          })
        )}
      </ul>
      <div className="border-t border-border p-3">
        <Button type="button" variant="outline" size="sm" className="w-full" onClick={clearPlaylist}>
          Clear playlist
        </Button>
      </div>
    </aside>
  );
}
