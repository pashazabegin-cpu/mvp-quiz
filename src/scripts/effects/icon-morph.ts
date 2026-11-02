/**
 * Переход иконок «Программы» — WebGL, один шейдер на <canvas data-icon-morph>.
 * Текущая иконка «растекается» по полю шума, следующая собирается из той же «жидкости»;
 * фронт растворения светится акцентным голубым, на середине перехода — лёгкое расслоение цвета.
 * Прогресс перехода задаёт скролл: set(index, p) — иконка index → index+1, p 0…1.
 * Без WebGL возвращает null — тогда показываются обычные картинки (crossfade в program.ts).
 */

const VERTEX = `
attribute vec2 aPos;
varying vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAGMENT = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uA;
uniform sampler2D uB;
uniform float uP;
uniform float uTime;
uniform vec3 uGlow;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}
vec4 tex(sampler2D t, vec2 uv) {
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return vec4(0.0);
  return texture2D(t, uv);
}
vec4 sampleRGB(sampler2D t, vec2 uv, float ca) {
  vec4 c = tex(t, uv);
  c.r = tex(t, uv + vec2(ca, 0.0)).r;
  c.b = tex(t, uv - vec2(ca, 0.0)).b;
  return c;
}

void main() {
  vec2 uv = vUv;
  float p = uP;
  float bell = sin(3.14159265 * p);
  vec2 c = uv - 0.5;

  // поле течения: «жидкость», которая медленно живёт во времени
  vec2 flow = vec2(fbm(uv * 3.0 + uTime * 0.12), fbm(uv * 3.0 + 17.3 - uTime * 0.12)) - 0.5;

  // текущая иконка растекается и чуть раздувается, следующая собирается из сжатия
  vec2 uvA = 0.5 + c * (1.0 + p * 0.22) + flow * bell * 0.5 * p;
  vec2 uvB = 0.5 + c * (1.0 - (1.0 - p) * 0.18) - flow * bell * 0.5 * (1.0 - p);

  float ca = 0.014 * bell;
  vec4 a = sampleRGB(uA, uvA, ca);
  vec4 b = sampleRGB(uB, uvB, ca);

  // фронт растворения по шуму
  float n = fbm(uv * 4.0 + 3.7);
  float edge = 0.16;
  float m = smoothstep(n - edge, n + edge, p * (1.0 + 2.0 * edge) - edge);
  vec4 col = mix(a, b, m);

  // светящаяся кромка фронта (цвет premultiplied — умножаем на альфу)
  float rim = (1.0 - abs(m * 2.0 - 1.0)) * bell;
  float alpha = max(a.a, b.a);
  col.rgb += uGlow * rim * 1.1 * alpha;
  col.a = max(col.a, rim * alpha * 0.5);
  gl_FragColor = col;
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
  return s;
}

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

export class IconMorph {
  private gl: WebGLRenderingContext;
  private textures: WebGLTexture[] = [];
  private u: Record<string, WebGLUniformLocation | null> = {};
  private index = 0;
  private p = 0;
  private visible = true;
  private start = performance.now();
  ready: Promise<void>;

  static create(canvas: HTMLCanvasElement, urls: string[], glow: [number, number, number]): IconMorph | null {
    try {
      return new IconMorph(canvas, urls, glow);
    } catch {
      return null;
    }
  }

  private constructor(
    private canvas: HTMLCanvasElement,
    urls: string[],
    glow: [number, number, number],
  ) {
    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) throw new Error('no webgl');
    this.gl = gl;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    for (const name of ['uA', 'uB', 'uP', 'uTime', 'uGlow']) this.u[name] = gl.getUniformLocation(prog, name);
    gl.uniform1i(this.u.uA, 0);
    gl.uniform1i(this.u.uB, 1);
    gl.uniform3fv(this.u.uGlow, glow);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

    this.ready = Promise.all(urls.map(loadImage)).then((imgs) => {
      this.textures = imgs.map((img) => {
        const t = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        return t;
      });
      this.resize();
      this.render();
    });

    new ResizeObserver(() => this.resize()).observe(canvas);
    new IntersectionObserver(([e]) => (this.visible = e.isIntersecting)).observe(canvas);
    requestAnimationFrame(this.loop);
  }

  /** Показать переход от иконки index к index+1 на долю p (0…1) */
  set(index: number, p: number) {
    this.index = index;
    this.p = p;
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(r.width * dpr));
    const h = Math.max(1, Math.round(r.height * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
      this.gl.viewport(0, 0, w, h);
    }
  }

  private render() {
    if (!this.textures.length) return;
    const gl = this.gl;
    const a = this.textures[Math.min(this.index, this.textures.length - 1)];
    const b = this.textures[Math.min(this.index + 1, this.textures.length - 1)];
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, a);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, b);
    gl.uniform1f(this.u.uP, this.p);
    gl.uniform1f(this.u.uTime, (performance.now() - this.start) / 1000);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  private loop = () => {
    if (this.visible) this.render();
    requestAnimationFrame(this.loop);
  };
}
