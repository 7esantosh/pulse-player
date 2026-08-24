import { useEffect, useRef } from "react";
import { getAnalyser } from "@/lib/player/audio-graph";

export function Visualizer({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let frame = 0;
    const draw = () => {
      frame = requestAnimationFrame(draw);
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      const analyser = getAnalyser();
      const bars = 40;
      const gap = 4;
      const bw = (width - gap * (bars - 1)) / bars;
      if (!analyser || !active) {
        ctx.fillStyle = "rgba(197, 201, 209, 0.18)";
        for (let i = 0; i < bars; i++) {
          const h = 6;
          ctx.fillRect(i * (bw + gap), height / 2 - h / 2, bw, h);
        }
        return;
      }
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      for (let i = 0; i < bars; i++) {
        const idx = Math.floor((i / bars) * data.length * 0.7);
        const v = (data[idx] ?? 0) / 255;
        const h = Math.max(6, v * height * 0.85);
        ctx.fillStyle = `rgba(197, 201, 209, ${0.28 + v * 0.55})`;
        ctx.fillRect(i * (bw + gap), (height - h) / 2, bw, h);
      }
    };
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
    };
    resize();
    window.addEventListener("resize", resize);
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [active]);

  return <canvas ref={canvasRef} className="h-full w-full" aria-hidden="true" />;
}
