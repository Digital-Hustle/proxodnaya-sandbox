import type { FrameStat } from "@/shared/api";

/** Снимает статистику кадров за durationMs: яркость, контраст, движение относительно прошлого кадра. */
export const sampleFrames = (video: HTMLVideoElement | null, durationMs: number, stepMs = 250): Promise<FrameStat[]> =>
  new Promise((resolve) => {
    const W = 64, H = 48;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    let prev: Float32Array | null = null;
    const out: FrameStat[] = [];
    const tick = () => {
      if (!video || !ctx || !video.videoWidth) return;
      ctx.drawImage(video, 0, 0, W, H);
      const px = ctx.getImageData(0, 0, W, H).data;
      const g = new Float32Array(W * H);
      let sum = 0;
      for (let i = 0; i < g.length; i++) { g[i] = (px[i * 4] * 0.299 + px[i * 4 + 1] * 0.587 + px[i * 4 + 2] * 0.114) / 255; sum += g[i]; }
      const mean = sum / g.length;
      let v = 0, diff = 0;
      for (let i = 0; i < g.length; i++) { v += (g[i] - mean) ** 2; if (prev) diff += Math.abs(g[i] - prev[i]); }
      out.push({ brightness: mean, contrast: Math.sqrt(v / g.length), motion: prev ? diff / g.length : 0 });
      prev = g;
    };
    const id = setInterval(tick, stepMs);
    setTimeout(() => { clearInterval(id); resolve(out); }, durationMs);
  });

/** Синтетические кадры для режима без камеры: живой человек двигается, фото — нет. */
export const syntheticFrames = (live: boolean): FrameStat[] =>
  Array.from({ length: 12 }, (_, i) => ({ brightness: 0.45, contrast: 0.18, motion: i === 0 ? 0 : live ? 0.02 + Math.random() * 0.03 : Math.random() * 0.004 }));
