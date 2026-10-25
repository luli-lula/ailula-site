// Full-screen drifting fog drawn over the photos. Plain WebGL: one triangle, fbm noise.
const VERT = `attribute vec2 p; varying vec2 uv; void main(){ uv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;
const FRAG = `precision mediump float;
varying vec2 uv; uniform float uTime, uDensity, uScroll, uAspect; uniform vec3 uTint;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 6; i++){ v += a * noise(p); p = p * 2.02 + 3.1; a *= 0.5; } return v; }
void main(){
  vec2 q = vec2(uv.x * uAspect, uv.y);
  // Two sheets drifting at different speeds give the fog depth; both stream down as the climber rises.
  float far = fbm(q * vec2(1.2, 2.2) + vec2(uTime * 0.012, uScroll * 0.6 + uTime * 0.004));
  float near = fbm(q * vec2(2.0, 3.4) + vec2(-uTime * 0.02, uScroll * 1.4 + uTime * 0.01));
  float veil = smoothstep(0.25, 0.85, far) * 0.6 + smoothstep(0.4, 0.9, near) * 0.55;
  float a = clamp(uDensity * (0.35 + veil), 0.0, 0.97);
  gl_FragColor = vec4(uTint * a, a);
}`;

export interface Fog { set(density: number, scroll: number, tint: [number, number, number]): void; dispose(): void }

export function createFog(canvas: HTMLCanvasElement): Fog | null {
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true });
  if (!gl) return null;
  const shader = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  const u = (n: string) => gl.getUniformLocation(prog, n);
  const [uTime, uDensity, uScroll, uAspect, uTint] = ['uTime', 'uDensity', 'uScroll', 'uAspect', 'uTint'].map(u);

  let density = 0.3, scroll = 0, tint: [number, number, number] = [0.93, 0.94, 0.92], raf = 0;
  const start = performance.now();
  const frame = () => {
    // Half resolution is plenty for soft fog and keeps phones cool.
    const w = Math.floor(canvas.clientWidth / 2), h = Math.floor(canvas.clientHeight / 2);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(uTime, (performance.now() - start) / 1000);
    gl.uniform1f(uDensity, density);
    gl.uniform1f(uScroll, scroll);
    gl.uniform1f(uAspect, w / Math.max(1, h));
    gl.uniform3f(uTint, ...tint);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return {
    set(d, s, t) { density = d; scroll = s; tint = t; },
    dispose() { cancelAnimationFrame(raf); },
  };
}
