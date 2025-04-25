import { enumerate_list } from "./iterate.js";
import { identity, mmul } from "./matrix.js";
export const compile_material = (m) => {
    switch (m.type) {
        case 'null': {
            return `
{ ${m.text}; }
discard;`;
        }
        case 'emit': {
            return `
highp vec3 emit = vec3(0.0);
{ ${m.text}; }
return emit;`;
        }
        case 'diffuse': {
            return `
highp vec3 color = vec3(0.0);
{ ${m.text}; }
highp vec3 r = ambient_light * color;
for (uint i = 0u; i < light_count; i++) {
  highp vec3 dir = light_position[i] - world_position;
  highp float diffuse_light = max(0.0, dot(world_normal, normalize(dir))) / dot(dir, dir);
  r += color * light_color[i] * diffuse_light; }
return r;`;
        }
        case 'phong': {
            return `
highp vec3 diffuse_color = vec3(0.0);
highp vec3 specular_color = vec3(0.0);
highp float cosine_power = 1.0;
{ ${m.text}; }
highp vec3 r = ambient_light * (diffuse_color + specular_color);
for (uint i = 0u; i < light_count; i++) {
  highp vec3 dir = light_position[i] - world_position;
  highp float illum = max(0.0, dot(world_normal, normalize(dir))) / dot(dir, dir);
  highp vec3 diffuse_light = diffuse_color * illum;
  highp vec3 specular_light = specular_color * illum * pow(max(0.0, dot(normalize(world_position - view), reflect(normalize(dir), world_normal))), cosine_power);
  r += light_color[i] * (diffuse_light + specular_light); }
return r;`;
        }
    }
};
export const make_viewer_desc = (scene, geometry) => {
    const vertex_shader = Symbol('vertex_shader');
    const fsquad_shader = Symbol('fsquad_shader');
    const cube_indices = Symbol('cube_indices');
    const cube_vertices = Symbol('cube_vertices');
    const desc = {
        clearColor: [0.0, 0.0, 0.0, 0.0],
        clearDepth: 0.0,
        textures: {},
        programs: {},
        shaders: {
            [vertex_shader]: {
                type: "vertex",
                text: `#version 300 es

in vec4 coordinates;

out highp vec3 object_position;
out highp vec3 world_position;

uniform mat4 object;
uniform mat4 transform;

void main(void) {
  object_position = coordinates.xyz;
  world_position = (vec4(object_position, 1.0) * object).xyz;
  gl_Position.xywz = vec4((vec4(world_position, 1.0) * transform).xyw, 0.0); }`
            },
            [fsquad_shader]: {
                type: "vertex",
                text: `#version 300 es
out highp vec3 object_position;
out highp vec3 world_position;

uniform mat4 object;
uniform mat4 transform;

void main(void) {
  gl_Position = vec4(
    gl_VertexID % 2 == 0 ? -1.0 : 1.0,
    gl_VertexID / 2 == 0 ? -1.0 : 1.0,
    0.0, 1.0);
  world_position = (vec4(gl_Position.xyw, 0.0).xywz * inverse(transform)).xyz;
  object_position = (vec4(world_position, 0.0) * inverse(object)).xyz; }`
            }
        },
        buffers: {
            [cube_indices]: {
                type: "short",
                kind: "element array",
                data: [
                    0, 3, 2, 0, 1, 3,
                    1, 5, 3, 3, 5, 7,
                    7, 5, 6, 6, 5, 4,
                    4, 5, 0, 0, 5, 1,
                    4, 0, 6, 6, 0, 2,
                    7, 6, 3, 3, 6, 2
                ]
            },
            [cube_vertices]: {
                type: "float",
                kind: "array",
                data: [
                    -1.0, -1.0, -1.0,
                    -1.0, -1.0, 1.0,
                    -1.0, 1.0, -1.0,
                    -1.0, 1.0, 1.0,
                    1.0, -1.0, -1.0,
                    1.0, -1.0, 1.0,
                    1.0, 1.0, -1.0,
                    1.0, 1.0, 1.0
                ]
            }
        },
        tasks: []
    };
    const token = new Map();
    const walk = (g) => {
        switch (g.type) {
            case 'null': {
                return [];
            }
            case 'group': {
                return enumerate_list(g.instances, (_name, instance) => {
                    const tp = (() => {
                        const tk = token.get(instance.geometry);
                        if (tk) {
                            return tk;
                        }
                        const gp = scene.geometry[instance.geometry];
                        if (!gp) {
                            throw new Error("Specified geometry not found.");
                        }
                        return walk(gp);
                    })();
                    return tp.map(z => {
                        const desc = {
                            program: z.program,
                            kind: z.kind,
                            ...'indices' in z ? { indices: z.indices } : {},
                            count: z.count,
                            attributes: z.attributes,
                            uniforms: [...z.uniforms]
                        };
                        const o = desc.uniforms.find(u => u.name === 'object');
                        if (!o || o.type != 'mat4') {
                            throw new Error("Internal Error.");
                        }
                        o.value = mmul(o.value, instance.transform);
                        return desc;
                    });
                }).flat();
            }
            case 'surface': {
                const m = scene.materials[g.material];
                if (!m) {
                    throw new Error("Specified material not found.");
                }
                const s = scene.surfaces[g.surface];
                if (!s) {
                    throw new Error("Specified surface not found.");
                }
                const id = Symbol();
                const material_text = compile_material(m);
                const tasks = [];
                const [vshader, proxy_text] = (() => {
                    switch (s.type) {
                        case 'sphere': {
                            tasks.push({
                                kind: 'triangles',
                                count: 36,
                                indices: cube_indices,
                                program: id,
                                uniforms: [{
                                        name: 'object',
                                        type: 'mat4',
                                        value: identity()
                                    }],
                                attributes: [{
                                        name: 'coordinates',
                                        size: 3,
                                        buffer: cube_vertices
                                    }]
                            });
                            return [vertex_shader, `
highp vec3 off = object_position - object_view;
highp float dist = length(off);
highp vec3 dp = normalize(off);
highp float dpp = -dot(object_position, dp);
highp float rc = 1.0 - pow(length(object_position + dpp * dp), 2.0);
if (rc < 0.0) { discard; }
highp float src = sqrt(rc);
highp vec3 orig = object_position;
highp float d = dpp - src;
if (d > 0.0 || -d < dist) {
  object_position = orig + d * dp;
  highp vec3 object_normal = normalize(object_position);
  bool clip = false;
  { ${s.text}; }
  if (!clip) {
    return object_normal; } }
d = dpp + src;
if (-d < dist) {
  object_position = orig + d * dp;
  highp vec3 object_normal = -normalize(object_position);
  bool clip = false;
  { ${s.text}; }
  if (!clip) {
    return object_normal; } }
discard;`];
                        }
                        case 'plane': {
                            tasks.push({
                                kind: 'triangle strip',
                                count: 4,
                                program: id,
                                uniforms: [{
                                        name: 'object',
                                        type: 'mat4',
                                        value: identity()
                                    }],
                                attributes: []
                            });
                            return [fsquad_shader, `
  object_position = normalize(object_position);
  highp float off = -object_view.y / object_position.y;
  if (off < 0.0) {
    discard; }
  object_position = object_view + off * object_position;
  return vec3(0.0, sign(object_view.y), 0.0);`];
                        }
                    }
                })();
                desc.shaders[id] = {
                    type: 'fragment',
                    text: `#version 300 es

in highp vec3 object_position;
in highp vec3 world_position;

out highp vec4 fragColor;

uniform highp mat4 transform;

uniform highp mat4 object;

const highp vec3 ambient_light = vec3(0.01);

const uint light_count = 4u;
const highp vec3 light_position[4] = vec3[](
  vec3(-10.0, 20.0, -10.0),
  vec3(-10.0, 20.0,  10.0),
  vec3( 10.0, 20.0, -10.0),
  vec3( 10.0, 20.0,  10.0));
const highp vec3 light_color[4] = vec3[](
  vec3(1e2),
  vec3(1e2),
  vec3(1e2),
  vec3(1e2));

highp vec3 material(
  highp vec3 view,
  highp vec3 world_position,
  highp vec3 object_position,
  highp vec3 world_normal,
  highp vec3 object_normal) {
  ${material_text} }

highp vec3 proxy(
  inout highp vec3 object_position,
  highp vec3 object_view) {
  ${proxy_text} }

void main2(
  highp vec3 world_position,
  highp vec3 object_position) {
  highp mat4 iobject = inverse(object);
  highp vec3 world_view = (vec4(0.0, 0.0, 1.0, 0.0) * inverse(transform)).xyz;
  highp vec3 object_view = (vec4(world_view, 1.0) * iobject).xyz;
  highp vec3 object_normal = proxy(object_position, object_view);
  world_position = (vec4(object_position, 1.0) * object).xyz;
  highp vec3 world_normal = normalize((iobject * vec4(object_normal, 0.0)).xyz);
  highp vec3 color = material(
    world_view,
    world_position,
    object_position,
    world_normal,
    object_normal);
  highp float depth = (vec4(world_position, 1.0) * transform).w;
  fragColor = vec4(color, 1.0);
  gl_FragDepth = 1.0 / (1.0 + depth); }

void main(void) {
  main2(world_position, object_position); }`
                };
                desc.programs[id] = {
                    vertex_shader: vshader,
                    fragment_shader: id,
                    transform_name: 'transform',
                    view_name: 'view'
                };
                return tasks;
            }
        }
    };
    desc.tasks = walk(geometry);
    return desc;
};
//# sourceMappingURL=compile.js.map