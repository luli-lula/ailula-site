// Draws the climb photos in WebGL, each displaced by its depth map so near trunks move faster than
// far fog (2.5D parallax). Fog lives in its own canvas on top (fog.ts).
export interface StagePhoto {
  color: string;
  depth: string;
  focus: [number, number]; // like CSS object-position, 0..1
  grade: { exposure: number; saturation: number; warmth: number };
}
export interface PhotoState { opacity: number; local: number }

const VERT = `attribute vec2 p; varying vec2 uv; void main(){ uv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;
const FRAG = `precision mediump float;
varying vec2 uv;
uniform sampler2D uColor, uDepth;
uniform float uImgAspect, uViewAspect, uOpacity, uLocal, uExposure, uSaturation, uWarmth;
uniform vec2 uFocus, uPointer;
void main(){
  // object-fit: cover, with headroom for the parallax travel.
  vec2 scale = uViewAspect > uImgAspect ? vec2(1.0, uImgAspect / uViewAspect) : vec2(uViewAspect / uImgAspect, 1.0);
  float zoom = 1.18 + uLocal * 0.06;
  vec2 st = (uv - 0.5) * scale / zoom;
  vec2 room = 0.5 - 0.5 * scale / zoom;
  vec2 centre = 0.5 + (uFocus - 0.5) * 2.0 * room;
  // Climbing: the scene slides down past the viewer; near things (bright depth) slide further.
  float d = texture2D(uDepth, centre + st).r;
  vec2 travel = vec2(0.0, (uLocal - 0.5) * (0.04 + d * 0.13));
  vec2 lean = uPointer * (d - 0.35) * vec2(0.025, 0.015);
  vec2 q = clamp(centre + st + travel + lean, 0.001, 0.999);
  vec3 c = texture2D(uColor, q).rgb * uExposure;
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(vec3(l), c, uSaturation);
  c *= vec3(1.0 + uWarmth, 1.0 + uWarmth * 0.4, 1.0 - uWarmth * 0.6);
  gl_FragColor = vec4(c * uOpacity, uOpacity);
}`;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`failed to load ${src}`));
    img.src = src;
  });
}

export function createDepthStage(canvas: HTMLCanvasElement, photos: StagePhoto[]) {
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
  if (!gl) return null;
  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aP = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(aP);
  gl.vertexAttribPointer(aP, 2, gl.FLOAT, false, 0, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  const U = Object.fromEntries(
    ['uColor', 'uDepth', 'uImgAspect', 'uViewAspect', 'uOpacity', 'uLocal', 'uExposure', 'uSaturation', 'uWarmth', 'uFocus', 'uPointer'].map((n) => [n, gl.getUniformLocation(prog, n)]),
  );
  gl.uniform1i(U.uColor, 0);
  gl.uniform1i(U.uDepth, 1);

  const texture = (img: HTMLImageElement) => {
    const t = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  };

  type Loaded = { color: WebGLTexture; depth: WebGLTexture; aspect: number };
  const loaded: (Loaded | null)[] = photos.map(() => null);
  // Load in climb order so the landing photo is ready first.
  const ready = photos.reduce<Promise<void>>(
    (chain, p, i) =>
      chain.then(async () => {
        const [c, d] = await Promise.all([loadImage(p.color), loadImage(p.depth)]);
        loaded[i] = { color: texture(c), depth: texture(d), aspect: c.naturalWidth / c.naturalHeight };
        if (i === 0) firstReady();
      }),
    Promise.resolve(),
  );
  let firstReady: () => void = () => {};
  const first = new Promise<void>((r) => (firstReady = r));

  return {
    first,
    ready,
    render(states: PhotoState[], pointer: [number, number]) {
      const dpr = Math.min(window.devicePixelRatio, 1.5);
      const w = Math.floor(canvas.clientWidth * dpr), h = Math.floor(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(U.uViewAspect, w / Math.max(1, h));
      gl.uniform2f(U.uPointer, pointer[0], pointer[1]);
      states.forEach((s, i) => {
        const tex = loaded[i];
        if (!tex || s.opacity <= 0.001) return;
        const p = photos[i];
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex.color);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, tex.depth);
        gl.uniform1f(U.uImgAspect, tex.aspect);
        gl.uniform1f(U.uOpacity, s.opacity);
        gl.uniform1f(U.uLocal, s.local);
        gl.uniform2f(U.uFocus, p.focus[0], 1 - p.focus[1]);
        gl.uniform1f(U.uExposure, p.grade.exposure);
        gl.uniform1f(U.uSaturation, p.grade.saturation);
        gl.uniform1f(U.uWarmth, p.grade.warmth);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      });
    },
  };
}
