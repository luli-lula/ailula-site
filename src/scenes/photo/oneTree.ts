// One photo of one redwood; the climb is a single continuous camera move up its trunk.
// Depth map adds dolly parallax (near bark grows faster than far fog as the camera pushes in).
export interface Shot { h: number; cx: number; cy: number; zoom: number; rot: number } // cx/cy: image coords, y down

const VERT = `attribute vec2 p; varying vec2 uv; void main(){ uv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;
const FRAG = `precision mediump float;
varying vec2 uv;
uniform sampler2D uColor, uDepth;
uniform float uImgAspect, uViewAspect, uZoom, uRot, uDolly;
uniform vec2 uCenter, uPointer;
void main(){
  vec2 cover = uViewAspect > uImgAspect ? vec2(1.0, uImgAspect / uViewAspect) : vec2(uViewAspect / uImgAspect, 1.0);
  vec2 st = (uv - 0.5) * cover / uZoom;
  // Rotate in pixel-proportional space so the image is not sheared.
  st.x *= uImgAspect;
  float c = cos(uRot), s = sin(uRot);
  st = mat2(c, -s, s, c) * st;
  st.x /= uImgAspect;
  float d = texture2D(uDepth, uCenter + st).r;
  st *= 1.0 - (d - 0.4) * uDolly;
  st += uPointer * (d - 0.35) * vec2(0.02, 0.012) / uZoom;
  vec3 col = texture2D(uColor, clamp(uCenter + st, 0.001, 0.999)).rgb;
  float l = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(l), col, 0.86) * 1.04;
  gl_FragColor = vec4(col, 1.0);
}`;

const ease = (t: number) => t * t * (3 - 2 * t);

// Piecewise eased interpolation between shots.
export function shotAt(shots: Shot[], h: number): Omit<Shot, 'h'> {
  if (h <= shots[0].h) return shots[0];
  for (let i = 1; i < shots.length; i++) {
    const a = shots[i - 1], b = shots[i];
    if (h <= b.h) {
      const t = ease((h - a.h) / (b.h - a.h));
      const mix = (x: number, y: number) => x + (y - x) * t;
      return { cx: mix(a.cx, b.cx), cy: mix(a.cy, b.cy), zoom: mix(a.zoom, b.zoom), rot: mix(a.rot, b.rot) };
    }
  }
  return shots[shots.length - 1];
}

// Keep the view inside the photo for any screen shape and rotation.
export function clampCenter(shot: Omit<Shot, 'h'>, imgAspect: number, viewAspect: number) {
  const cover = viewAspect > imgAspect ? [1, imgAspect / viewAspect] : [viewAspect / imgAspect, 1];
  const hx = (0.5 * cover[0]) / shot.zoom * imgAspect, hy = (0.5 * cover[1]) / shot.zoom;
  const r = (shot.rot * Math.PI) / 180, c = Math.abs(Math.cos(r)), s = Math.abs(Math.sin(r));
  const ex = (c * hx + s * hy) / imgAspect + 0.012, ey = s * hx + c * hy + 0.012;
  const clamp = (v: number, e: number) => (e >= 0.5 ? 0.5 : Math.min(1 - e, Math.max(e, v)));
  return { ...shot, cx: clamp(shot.cx, ex), cy: clamp(shot.cy, ey) };
}

export function createOneTree(canvas: HTMLCanvasElement, color: string, depth: string) {
  const gl = canvas.getContext('webgl', { antialias: false });
  if (!gl) return null;
  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aP = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(aP);
  gl.vertexAttribPointer(aP, 2, gl.FLOAT, false, 0, 0);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  const U = Object.fromEntries(
    ['uColor', 'uDepth', 'uImgAspect', 'uViewAspect', 'uZoom', 'uRot', 'uDolly', 'uCenter', 'uPointer'].map((n) => [n, gl.getUniformLocation(prog, n)]),
  );
  gl.uniform1i(U.uColor, 0);
  gl.uniform1i(U.uDepth, 1);

  const load = (src: string, unit: number) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const t = gl.createTexture()!;
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]])
          gl.texParameteri(gl.TEXTURE_2D, k, v);
        resolve(img);
      };
      img.onerror = () => reject(new Error(`failed to load ${src}`));
      img.src = src;
    });

  let imgAspect = 2 / 3;
  const ready = Promise.all([load(color, 0), load(depth, 1)]).then(([c]) => {
    imgAspect = c.naturalWidth / c.naturalHeight;
  });

  return {
    ready,
    render(shot: Omit<Shot, 'h'>, dolly: number, pointer: [number, number]) {
      const dpr = Math.min(window.devicePixelRatio, 1.5);
      const w = Math.floor(canvas.clientWidth * dpr), h = Math.floor(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h);
      const view = w / Math.max(1, h);
      const s = clampCenter(shot, imgAspect, view);
      gl.uniform1f(U.uImgAspect, imgAspect);
      gl.uniform1f(U.uViewAspect, view);
      gl.uniform1f(U.uZoom, s.zoom);
      gl.uniform1f(U.uRot, (s.rot * Math.PI) / 180);
      gl.uniform1f(U.uDolly, dolly);
      gl.uniform2f(U.uCenter, s.cx, 1 - s.cy);
      gl.uniform2f(U.uPointer, pointer[0], pointer[1]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
}
