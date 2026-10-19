// Small WebGL2 helpers: programs, textures and render targets.

export type GL = WebGL2RenderingContext;

export class Program {
  readonly program: WebGLProgram;
  private readonly locations = new Map<string, WebGLUniformLocation | null>();

  constructor(
    private readonly gl: GL,
    vertex: string,
    fragment: string,
    label: string,
  ) {
    const vs = compile(gl, gl.VERTEX_SHADER, vertex, label);
    const fs = compile(gl, gl.FRAGMENT_SHADER, fragment, label);
    const program = gl.createProgram();
    if (!program) throw new Error("Could not create a WebGL program");
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error(`${label}: link failed\n${log}`);
    }
    this.program = program;
  }

  use() {
    this.gl.useProgram(this.program);
    return this;
  }

  loc(name: string) {
    let l = this.locations.get(name);
    if (l === undefined) {
      l = this.gl.getUniformLocation(this.program, name);
      this.locations.set(name, l);
    }
    return l;
  }

  f(name: string, ...v: number[]) {
    const l = this.loc(name);
    if (!l) return this;
    const gl = this.gl;
    if (v.length === 1) gl.uniform1f(l, v[0]);
    else if (v.length === 2) gl.uniform2f(l, v[0], v[1]);
    else if (v.length === 3) gl.uniform3f(l, v[0], v[1], v[2]);
    else gl.uniform4f(l, v[0], v[1], v[2], v[3]);
    return this;
  }

  i(name: string, v: number) {
    const l = this.loc(name);
    if (l) this.gl.uniform1i(l, v);
    return this;
  }

  tex(name: string, unit: number, texture: WebGLTexture | null) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    return this.i(name, unit);
  }

  dispose() {
    this.gl.deleteProgram(this.program);
  }
}

function compile(gl: GL, type: number, source: string, label: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Could not create a shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? "";
    gl.deleteShader(shader);
    const numbered = source
      .split("\n")
      .map((l, i) => `${String(i + 1).padStart(4)} ${l}`)
      .join("\n");
    throw new Error(`${label}: shader compile failed\n${log}\n${numbered}`);
  }
  return shader;
}

export interface Texture {
  tex: WebGLTexture;
  width: number;
  height: number;
  bytes: number;
}

/** Upload an image-like source as an immutable texture, optionally with a full mip chain. */
export function uploadTexture(
  gl: GL,
  source: TexImageSource,
  width: number,
  height: number,
  opts: { mips?: boolean; linear?: boolean } = {},
): Texture {
  const tex = gl.createTexture();
  if (!tex) throw new Error("Could not create a texture");
  const levels = opts.mips ? Math.floor(Math.log2(Math.max(width, height))) + 1 : 1;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
  gl.texStorage2D(gl.TEXTURE_2D, levels, gl.RGBA8, width, height);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, source);
  if (opts.mips) gl.generateMipmap(gl.TEXTURE_2D);
  const linear = opts.linear !== false;
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    opts.mips ? gl.LINEAR_MIPMAP_LINEAR : linear ? gl.LINEAR : gl.NEAREST,
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, linear ? gl.LINEAR : gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return { tex, width, height, bytes: width * height * 4 * (opts.mips ? 1.34 : 1) };
}

/** A mutable texture for video frames or canvas uploads. */
export function dynamicTexture(gl: GL): WebGLTexture {
  const tex = gl.createTexture();
  if (!tex) throw new Error("Could not create a texture");
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

/** A plain 1x1 texture used when a scene has no map for a slot. */
export function solidTexture(gl: GL, rgba: [number, number, number, number]): WebGLTexture {
  const tex = gl.createTexture();
  if (!tex) throw new Error("Could not create a texture");
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(rgba));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  return tex;
}

export class Target {
  tex: WebGLTexture;
  fbo: WebGLFramebuffer;
  width = 0;
  height = 0;
  private hasMips = false;

  constructor(
    private readonly gl: GL,
    width: number,
    height: number,
    private readonly mips = false,
  ) {
    const tex = gl.createTexture();
    const fbo = gl.createFramebuffer();
    if (!tex || !fbo) throw new Error("Could not create a render target");
    this.tex = tex;
    this.fbo = fbo;
    this.resize(width, height);
  }

  resize(width: number, height: number) {
    width = Math.max(1, Math.round(width));
    height = Math.max(1, Math.round(height));
    if (width === this.width && height === this.height) return;
    const gl = this.gl;
    // immutable storage cannot be resized, so replace the texture
    gl.deleteTexture(this.tex);
    const tex = gl.createTexture();
    if (!tex) throw new Error("Could not create a render target");
    this.tex = tex;
    this.width = width;
    this.height = height;
    const levels = this.mips ? Math.min(6, Math.floor(Math.log2(Math.max(width, height))) + 1) : 1;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texStorage2D(gl.TEXTURE_2D, levels, gl.RGBA8, width, height);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.mips ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (this.mips) gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAX_LEVEL, levels - 1);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.hasMips = false;
  }

  bind() {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.viewport(0, 0, this.width, this.height);
    this.hasMips = false;
  }

  /** Build the mip chain after drawing, for blur lookups. */
  mipmap() {
    if (!this.mips || this.hasMips) return;
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.generateMipmap(gl.TEXTURE_2D);
    this.hasMips = true;
  }

  get bytes() {
    return this.width * this.height * 4 * (this.mips ? 1.34 : 1);
  }

  dispose() {
    this.gl.deleteTexture(this.tex);
    this.gl.deleteFramebuffer(this.fbo);
  }
}

/** Vertex shader for a full-screen triangle; no buffers needed. */
export const FULLSCREEN_VS = /* glsl */ `#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;
