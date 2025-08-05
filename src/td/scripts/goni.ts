import { brdf_mapping } from "./compile.js"
import { html_element } from "./dom.js"

export const measure_surface = (tests: number, bucket_divisions: number, sdf: string) => {

const bucket_edge = bucket_divisions * bucket_divisions
const bucket_count = bucket_edge * bucket_divisions

const canvas = html_element('canvas', function() {
  this.width = bucket_divisions
  this.height = bucket_edge }, [])

const gl = canvas.getContext('webgl2')
if (gl === null) {
  throw new Error("Unable to initialize WebGL. Your browser or machine may not support it.") }

const maxv = gl.getParameter(gl.MAX_ELEMENTS_VERTICES)
const rounds = Math.floor(tests / maxv)
const remainder = tests % maxv

gl.getExtension('EXT_color_buffer_float')

const target = gl.createTexture()
if (!target) {
  throw new Error("Could not create texture.") }
gl.bindTexture(gl.TEXTURE_2D, target)
gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, bucket_divisions, bucket_edge)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
gl.bindTexture(gl.TEXTURE_2D, null)

const fb = gl.createFramebuffer()
if (!fb) {
  throw new Error("Could not create frame buffer.") }
gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target, 0)
gl.bindFramebuffer(gl.FRAMEBUFFER, null)

const vertex_shader = gl.createShader(gl.VERTEX_SHADER)
if (!vertex_shader) {
  throw new Error("Could not create vertex shader.") }
gl.shaderSource(vertex_shader, `#version 300 es
precision highp float;

const float qp = acos(0.0);
const float pi = acos(-1.0);
const float tau = 2.0 * pi;

uniform uint round;

uint seed;

void srand(uvec3 coord) {
  uvec3 p = uvec3(37769685u, 26757677u, 20501397u) * coord;
  seed = p.x ^ p.y ^ p.z; }

float unitrand() {
  return pow(2.0, -32.0) * float(seed *= 594156893u); }

vec3 make_incident_direction() {
  float z = unitrand();
  float r = sqrt(1.0 - pow(z, 2.0));
  float t = tau * unitrand();
  return vec3(r * cos(t), r * sin(t), z); }

vec2 make_incident_point() {
  float r = sqrt(unitrand());
  float t = tau * unitrand();
  return vec2(r * cos(t), r * sin(t)); }

const float eps = 1e-4;

float map(vec3 p) {
  ${sdf} }

vec3 nf(vec3 p) {
  float d = map(p);
  vec2 e = vec2(eps, 0.0);
  return normalize(d - vec3(
    map(p - e.xyy),
    map(p - e.yxy),
    map(p - e.yyx))); }

const uint steps = 1u << 10u;

vec3 bounce(vec3 p, vec3 h) {
  for (uint i = 0u; i < steps && p.z <= 0.0; i++) {
    float d = map(p);
    if (d < eps) {
      vec3 n = nf(p);
      if (dot(n, h) < 0.0) {
        h = normalize(reflect(h, n)); } }
    p += h * max(eps, d); }
  return h; }

void main(void) {
  srand(uvec3(gl_VertexID, round, 1));
  vec3 incident_direction = make_incident_direction();
  vec3 incident_point = vec3(10.0 * make_incident_point(), 0.0);
  vec3 reflected_direction = bounce(incident_point, -incident_direction);
  vec3 object_normal = vec3(0.0, 0.0, 1.0);
  ${brdf_mapping}
  uint x = min(${bucket_divisions}u - 1u, uint(floor(${bucket_divisions}.0 * c0)));
  uint y = min(${bucket_divisions}u - 1u, uint(floor(${bucket_divisions}.0 * c1)));
  uint z = min(${bucket_divisions}u - 1u, uint(floor(${bucket_divisions}.0 * c2)));
  gl_Position = vec4(
    -1.0 + 2.0 * (float(x) + 1.0) / ${bucket_divisions}.0,
    -1.0 + 2.0 * (float(z + ${bucket_divisions}u * y) + 1.0) / ${bucket_edge}.0,
    0.0, 1.0); }`)
gl.compileShader(vertex_shader)

const fragment_shader = gl.createShader(gl.FRAGMENT_SHADER)
if (!fragment_shader) {
  throw new Error("Could not create fragment shader.") }
gl.shaderSource(fragment_shader, `#version 300 es
precision highp float;
uniform vec4 density;
out vec4 fragColor;
void main(void) {
  fragColor = density; }`)
gl.compileShader(fragment_shader)

const prog = gl.createProgram()
if (!prog) {
  throw new Error("Could not create shader program.") }
gl.attachShader(prog, vertex_shader)
gl.attachShader(prog, fragment_shader)
gl.linkProgram(prog)

const round = gl.getUniformLocation(prog, 'round')
const density = gl.getUniformLocation(prog, 'density')

gl.viewport(0.0, 0.0, bucket_divisions, bucket_edge)

gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
gl.enable(gl.BLEND)
gl.blendFunc(gl.ONE, gl.ONE)
gl.useProgram(prog)
gl.uniform4f(density, bucket_edge / tests, 0.0, 0.0, 0.0)

for (let i = 0; i < rounds; i++) {
  gl.uniform1ui(round, i + 1)
  gl.drawArrays(gl.POINTS, 0, maxv) }
if (tests) {
  gl.drawArrays(gl.POINTS, 0, remainder) }

const buckets = new Float32Array(4 * bucket_count)
gl.readPixels(
  0,
  0,
  bucket_divisions,
  bucket_edge,
  gl.RGBA,
  gl.FLOAT,
  buckets)

return buckets }

