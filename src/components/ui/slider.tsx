import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

type SliderProps = {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onValueChange: (value: number) => void;
  onValueCommit?: (value: number) => void;
  className?: string;
  ariaLabel?: string;
};

export function Slider({
  value,
  min = 0,
  max = 1,
  step = 0.01,
  onValueChange,
  onValueCommit,
  className,
  ariaLabel,
}: SliderProps) {
  return (
    <SliderPrimitive.Root
      className={cn("relative flex h-8 w-full touch-none select-none items-center", className)}
      value={[value]}
      min={min}
      max={max}
      step={step}
      onValueChange={(v) => onValueChange(v[0] ?? min)}
      onValueCommit={(v) => onValueCommit?.(v[0] ?? min)}
      aria-label={ariaLabel}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-surface-2">
        <SliderPrimitive.Range className="absolute h-full bg-accent" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block size-3.5 rounded-full bg-fg shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50" />
    </SliderPrimitive.Root>
  );
}
