/**
 * Живой WebGL-фон: <canvas data-shader> внутри секции.
 * Плавно «течёт» сам по себе и тянется к курсору.
 *
 * Цвета берутся из CSS-переменных --c-bg, --c-accent, --c-accent-2
 * (их можно переопределить на самой секции — фон перекрасится).
 * data-shader-intensity="0.7" — насколько ярко (по умолчанию 0.6).
 * Без WebGL канвас удаляется — остаётся CSS-фон секции.
 */

const VERTEX = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform vec3 uBg;
uniform vec3 uC1;
uniform vec3 uC2;
uniform float uIntensity;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.02; a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * aspect, uv.y);
  vec2 m = vec2(uMouse.x * aspect, uMouse.y);
  float t = uTime * 0.05;

  // поле течения + притяжение к курсору
  vec2 q = vec2(fbm(p * 1.5 + t), fbm(p * 1.5 - t + 4.2));
  float d = distance(p, m);
  q += (m - p) * 0.45 * exp(-d * 2.2);
  float n = fbm(p * 2.0 + q * 2.4 + t * 1.4);

  vec3 col = mix(uBg, uC2, smoothstep(0.3, 0.9, n) * uIntensity);
  col = mix(col, uC1, smoothstep(0.62, 1.0, n * (0.6 + q.y)) * uIntensity * 0.7);
  col += uC1 * 0.18 * exp(-d * 3.5) * uIntensity; // мягкое свечение под курсором

  // виньетка в цвет фона и лёгкое зерно
  col = mix(uBg, col, smoothstep(1.1, 0.2, distance(uv, vec2(0.5))));
  col += (hash(gl_FragCoord.xy + uTime) - 0.5) * 0.025;
  gl_FragColor = vec4(col, 1.0);
}
`;

/** Любой CSS-цвет → [r, g, b] в диапазоне 0..1 */
function cssColorToRgb(value: string): [number, number, number] {
  const ctx = document.createElement('canvas').getContext('2d')!;
  ctx.fillStyle = '#000';
  ctx.fillStyle = value.trim() || '#000';
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r / 255, g / 255, b / 255];
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) ?? 'shader compile error');
  }
  return shader;
}

class ShaderBackground {
  private gl: WebGLRenderingContext;
  private uniforms: Record<string, WebGLUniformLocation | null> = {};
  private mouse = { x: 0.7, y: 0.6 };
  private target = { x: 0.7, y: 0.6 };
  private visible = false;
  private start = performance.now();

  constructor(
    private canvas: HTMLCanvasElement,
    private animate: boolean,
  ) {
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
    if (!gl) throw new Error('WebGL недоступен');
    this.gl = gl;

    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);
    gl.useProgram(program);

    // один треугольник на весь экран
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    for (const name of ['uRes', 'uTime', 'uMouse', 'uBg', 'uC1', 'uC2', 'uIntensity']) {
      this.uniforms[name] = gl.getUniformLocation(program, name);
    }
    this.applyColors();

    const host = canvas.parentElement ?? canvas;
    host.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      this.target.x = (e.clientX - r.left) / r.width;
      this.target.y = 1 - (e.clientY - r.top) / r.height;
    });

    new ResizeObserver(() => this.resize()).observe(canvas);
    new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      if (this.visible) this.render();
    }).observe(canvas);
    this.resize();
    this.loop();
  }

  /** Перечитать цвета из CSS-переменных (например, после смены темы) */
  applyColors() {
    const style = getComputedStyle(this.canvas);
    const intensity = parseFloat(this.canvas.dataset.shaderIntensity ?? '') || 0.6;
    this.gl.uniform3fv(this.uniforms.uBg, cssColorToRgb(style.getPropertyValue('--c-bg')));
    this.gl.uniform3fv(this.uniforms.uC1, cssColorToRgb(style.getPropertyValue('--c-accent')));
    this.gl.uniform3fv(this.uniforms.uC2, cssColorToRgb(style.getPropertyValue('--c-accent-2')));
    this.gl.uniform1f(this.uniforms.uIntensity, intensity);
  }

  private resize() {
    // рендерим в пониженном разрешении: фон размытый, а нагрузка в разы меньше
    const scale = Math.min(window.devicePixelRatio, 1.5) * 0.5;
    const w = Math.max(1, Math.round(this.canvas.clientWidth * scale));
    const h = Math.max(1, Math.round(this.canvas.clientHeight * scale));
    if (this.canvas.width === w && this.canvas.height === h) return;
    this.canvas.width = w;
    this.canvas.height = h;
    this.gl.viewport(0, 0, w, h);
    this.gl.uniform2f(this.uniforms.uRes, w, h);
    this.render();
  }

  private render() {
    const gl = this.gl;
    this.mouse.x += (this.target.x - this.mouse.x) * 0.05;
    this.mouse.y += (this.target.y - this.mouse.y) * 0.05;
    gl.uniform1f(this.uniforms.uTime, this.animate ? (performance.now() - this.start) / 1000 : 12);
    gl.uniform2f(this.uniforms.uMouse, this.mouse.x, this.mouse.y);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  private loop = () => {
    if (this.visible && this.animate) this.render();
    requestAnimationFrame(this.loop);
  };
}

export function initShaderBackgrounds(animate: boolean) {
  document.querySelectorAll<HTMLCanvasElement>('canvas[data-shader]').forEach((canvas) => {
    try {
      new ShaderBackground(canvas, animate);
    } catch {
      canvas.remove();
    }
  });
}
