import { compile_material } from "./compile.js";
import { identity } from "./matrix.js";
import { create_pane } from "./playground.js";
import { create_viewer } from "./viewer.js";
export const add_material_viewer = (material) => create_pane({}, pane => {
    pane.set_title('Material Viewer');
    const [viewer, update_viewer, resize_viewer] = create_viewer(pane.get_width(), pane.get_height());
    pane.add_resize_handler(resize_viewer);
    const update = () => {
        const program = Symbol('program');
        const vertex_shader = Symbol('vertex_shader');
        const fragment_shader = Symbol('fragment_shader');
        const cube_indices = Symbol('cube_indices');
        const cube_vertices = Symbol('cube_vertices');
        const desc = {
            clearColor: [0.0, 0.0, 0.0, 0.0],
            clearDepth: 0.0,
            textures: {},
            programs: {
                [program]: {
                    vertex_shader,
                    fragment_shader,
                    transform_name: 'transform',
                    view_name: 'view'
                }
            },
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
                [fragment_shader]: {
                    type: "fragment",
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
  ${compile_material(material)} }

highp vec3 proxy(
  inout highp vec3 object_position,
  highp vec3 object_view) {
    highp vec3 off = object_position - object_view;
    highp float dist = length(off);
    highp vec3 dp = normalize(off);
    highp float dpp = -dot(object_position, dp);
    highp float rc = 1.0 - pow(length(object_position + dpp * dp), 2.0);
    if (rc < 0.0) { discard; }
    highp float src = sqrt(rc);
    highp vec3 orig = object_position;
    highp float d = dpp - src;
    object_position = orig + d * dp;
    highp vec3 object_normal = normalize(object_position);
    return object_normal; }

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
            tasks: [{
                    program,
                    kind: 'triangles',
                    indices: cube_indices,
                    count: 36,
                    attributes: [{
                            name: 'coordinates',
                            size: 3,
                            buffer: cube_vertices
                        }],
                    uniforms: [{
                            name: 'object',
                            type: 'mat4',
                            value: identity()
                        }]
                }]
        };
        return desc;
    };
    const desc = update();
    update_viewer(desc);
    return viewer;
});
//# sourceMappingURL=material_viewer.js.map