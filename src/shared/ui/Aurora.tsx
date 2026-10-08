// Живой фон из фирменных цветов на WebGL (ogl, ADR-036). Без WebGL — статичный градиент.
import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle, Color } from "ogl";
import { palette } from "@/shared/config/tokens";
import { cn } from "@/shared/lib";

const vert = `attribute vec2 position; void main(){ gl_Position = vec4(position, 0.0, 1.0); }`;
const frag = `precision highp float;
uniform float uTime; uniform vec2 uRes; uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3; uniform vec3 uBg; uniform float uIntensity;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }
float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.0; a*=0.5; } return v; }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes; vec2 p = uv * vec2(uRes.x/uRes.y, 1.0);
  float t = uTime * 0.06;
  float n1 = fbm(p * 1.4 + vec2(t, -t * 0.7));
  float n2 = fbm(p * 2.1 - vec2(t * 0.8, t * 0.4) + n1);
  vec3 col = mix(uC1, uC2, smoothstep(0.2, 0.8, n1));
  col = mix(col, uC3, smoothstep(0.45, 0.95, n2) * 0.8);
  float band = smoothstep(0.0, 0.9, uv.y + n2 * 0.4 - 0.25);
  gl_FragColor = vec4(mix(uBg, col, band * uIntensity), 1.0);
}`;

export const Aurora = ({ className, dark = false, intensity = 0.9 }: { className?: string; dark?: boolean; intensity?: number }) => {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: Renderer;
    try { renderer = new Renderer({ dpr: Math.min(2, devicePixelRatio), alpha: false }); } catch { return; }
    const gl = renderer.gl;
    el.appendChild(gl.canvas);
    gl.canvas.className = "absolute inset-0 size-full";
    const program = new Program(gl, {
      vertex: vert, fragment: frag,
      uniforms: {
        uTime: { value: 0 }, uRes: { value: [1, 1] }, uIntensity: { value: intensity },
        uC1: { value: new Color(palette.sber.green) }, uC2: { value: new Color(palette.sber.sky) }, uC3: { value: new Color(palette.sber.spring) },
        uBg: { value: new Color(dark ? palette.black : palette.gray[50]) },
      },
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
    const resize = () => { renderer.setSize(el.clientWidth, el.clientHeight); program.uniforms.uRes.value = [gl.drawingBufferWidth, gl.drawingBufferHeight]; };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();
    let raf = 0;
    const loop = (t: number) => { program.uniforms.uTime.value = t / 1000; renderer.render({ scene: mesh }); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); gl.canvas.remove(); gl.getExtension("WEBGL_lose_context")?.loseContext(); };
  }, [dark, intensity]);
  return <div ref={host} aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden bg-brand-gradient", className)} />;
};
