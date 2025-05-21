import { Vec4, Mat4 } from "./matrix.js";
const map = (o, f) => Object.fromEntries(Reflect.ownKeys(o).map((sym) => f(sym, o[sym])));
export const diagram = (desc) => {
    const canvas = document.createElement('canvas');
    canvas.width = desc.width;
    canvas.height = desc.height;
    const gl = canvas.getContext("webgl2");
    if (gl === null) {
        throw new Error("Unable to initialize WebGL. Your browser or machine may not support it.");
    }
    const PrepBufferTypeMap = {
        short: gl.SHORT,
        ushort: gl.UNSIGNED_SHORT,
        int: gl.INT,
        uint: gl.UNSIGNED_INT,
        float: gl.FLOAT
    };
    const PrepArrayTypeMap = {
        short: Int16Array,
        ushort: Uint16Array,
        int: Int32Array,
        uint: Uint32Array,
        float: Float32Array
    };
    const PrepTaskKindMap = {
        'points': gl.POINTS,
        'triangles': gl.TRIANGLES,
        'triangle strip': gl.TRIANGLE_STRIP,
        'lines': gl.LINES,
        'line strip': gl.LINE_STRIP
    };
    const PrepUniformSetterMap = {
        int: (location, x) => gl.uniform1i(location, x),
        uint: (location, x) => gl.uniform1ui(location, x),
        float: (location, x) => gl.uniform1f(location, x),
        vec2: (location, x) => gl.uniform2f(location, x[0], x[1]),
        vec3: (location, x) => gl.uniform3f(location, x[0], x[1], x[2]),
        vec4: (location, x) => gl.uniform4f(location, x[0], x[1], x[2], x[3]),
        mat2: (location, x) => gl.uniformMatrix4fv(location, false, [
            x[0], x[1],
            x[2], x[3]
        ]),
        mat3: (location, x) => gl.uniformMatrix4fv(location, false, [
            x[0], x[1], x[2],
            x[3], x[4], x[5],
            x[6], x[7], x[8]
        ]),
        mat4: (location, x) => gl.uniformMatrix4fv(location, false, [
            x[0], x[1], x[2], x[3],
            x[4], x[5], x[6], x[7],
            x[8], x[9], x[10], x[11],
            x[12], x[13], x[14], x[15]
        ])
    };
    gl.getExtension('EXT_color_buffer_float');
    gl.getExtension('EXT_float_blend');
    let target = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, target);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, canvas.width, canvas.height);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.bindTexture(gl.TEXTURE_2D, null);
    let target_depth = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, target_depth);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT32F, canvas.width, canvas.height);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.bindTexture(gl.TEXTURE_2D, null);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, target_depth, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    const draw_buffers = desc.buffers ? map(desc.buffers, (sym, buffer) => {
        const buf = gl.createBuffer();
        if (!buf) {
            throw new Error("Could not create buffer.");
        }
        if (buffer.kind === "array") {
            gl.bindBuffer(gl.ARRAY_BUFFER, buf);
            gl.bufferData(gl.ARRAY_BUFFER, new (PrepArrayTypeMap[buffer.type])(buffer.data), gl.STATIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }
        else if (buffer.kind === "element array") {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new (PrepArrayTypeMap[buffer.type])(buffer.data), gl.STATIC_DRAW);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        }
        return [sym, buf];
    }) : {};
    const vert = gl.createShader(gl.VERTEX_SHADER);
    if (!vert) {
        throw new Error("Could not create vertex shader.");
    }
    gl.shaderSource(vert, `#version 300 es

in vec4 vertices;

out highp vec3 position;

uniform mat4 transform;

void main(void) {
  position = vertices.xyz;
  gl_Position.xywz = vec4((vec4(position, 1.0) * transform).xyw, 0.0); }`);
    gl.compileShader(vert);
    const header = `#version 300 es

precision highp float;

in highp vec3 position;

uniform mat4 transform;

out highp vec4 fragColor;
`;
    const footer = ``;
    const draw_programs = desc.shaders ? map(desc.shaders, (sym, shader) => {
        const shad = gl.createShader(gl.FRAGMENT_SHADER);
        if (!shad) {
            throw new Error("Could not create fragment shader.");
        }
        gl.shaderSource(shad, `${header} ${shader} ${footer}`);
        gl.compileShader(shad);
        const prog = gl.createProgram();
        if (!prog) {
            throw new Error("Could not create shader program.");
        }
        gl.attachShader(prog, vert);
        gl.attachShader(prog, shad);
        gl.linkProgram(prog);
        return [sym, {
                program: prog,
                transform_location: gl.getUniformLocation(prog, "transform")
            }];
    }) : {};
    const default_transform = Mat4.pointwise(canvas.width, canvas.height);
    const draw_scene = {
        clearColor: new Vec4(desc.background[0], desc.background[1], desc.background[2], 0.0),
        clearDepth: 0.0,
        tasks: desc.tasks ? desc.tasks.map(task => {
            const prog = draw_programs[task.shader];
            if (!prog) {
                throw new Error("Specified program not found.");
            }
            if (!desc.buffers) {
                throw new Error("No buffers found.");
            }
            const vtx_desc = desc.buffers[task.vertices.buffer];
            if (!vtx_desc) {
                throw new Error("Specified buffer not found.");
            }
            return {
                program: prog,
                transform: task.transform || default_transform,
                uniforms: task.uniforms ? task.uniforms.map(uniform => {
                    const location = gl.getUniformLocation(prog.program, uniform.name);
                    return {
                        location,
                        type: uniform.type,
                        value: uniform.value
                    };
                }) : [],
                attributes: ([task.vertices, ...task.attributes ? task.attributes : []]).map(attribute => {
                    const att_buffer = draw_buffers[attribute.buffer];
                    if (!att_buffer) {
                        throw new Error("Specified buffer not found.");
                    }
                    if (!desc.buffers) {
                        throw new Error("No buffers found.");
                    }
                    const att_desc = desc.buffers[attribute.buffer];
                    if (!att_desc) {
                        throw new Error("Specified buffer not found.");
                    }
                    const location = gl.getAttribLocation(prog.program, attribute.name);
                    return {
                        location,
                        dimension: attribute.dimension,
                        type: PrepBufferTypeMap[att_desc.type],
                        buffer: att_buffer
                    };
                }),
                ...'indices' in task ? (() => {
                    const idx_buffer = draw_buffers[task.indices];
                    if (!idx_buffer) {
                        throw new Error("Specified buffer not found.");
                    }
                    const idx_desc = desc.buffers[task.indices];
                    if (!idx_desc) {
                        throw new Error("Specified buffer descriptor not found.");
                    }
                    return {
                        indices: idx_buffer,
                        type: PrepBufferTypeMap[idx_desc.type],
                        count: idx_desc.data.length
                    };
                })() :
                    {
                        count: vtx_desc.data.length / task.vertices.dimension
                    },
                kind: PrepTaskKindMap[task.kind]
            };
        }) : []
    };
    gl.depthFunc(gl.GEQUAL);
    gl.enable(gl.DEPTH_TEST);
    // gl.enable(gl.CULL_FACE)
    const quad_vertex_shader = gl.createShader(gl.VERTEX_SHADER);
    if (!quad_vertex_shader) {
        throw new Error("Unable to create vertex shader.");
    }
    gl.shaderSource(quad_vertex_shader, `#version 300 es
void main(void) {
  gl_Position = vec4(
    gl_VertexID % 2 == 0 ? -1.0 : 1.0,
    gl_VertexID / 2 == 0 ? -1.0 : 1.0,
    1.0, 1.0); }`);
    gl.compileShader(quad_vertex_shader);
    const transfer_fragment_shader = gl.createShader(gl.FRAGMENT_SHADER);
    if (!transfer_fragment_shader) {
        throw new Error("Unable to create fragment shader.");
    }
    gl.shaderSource(transfer_fragment_shader, `#version 300 es
uniform sampler2D tex;
uniform uint iFrame;
out highp vec4 fragColor;

uint seed;

void srand(uvec3 coord) {
  uvec3 p = uvec3(37769685u, 26757677u, 20501397u) * coord;
  seed = p.x ^ p.y ^ p.z; }

highp float unitrand() {
  return pow(2.0, -32.0) * float(seed *= 594156893u); }

highp float srgb_gamma(
  highp float v) {
  return v <= 0.0031308
    ? v * 12.92
    : 1.055 * pow(v, 0.41666666666) - 0.055; }

highp vec3 srgb_gamma(
  highp vec3 v) {
  return vec3(
    srgb_gamma(v.r),
    srgb_gamma(v.g),
    srgb_gamma(v.b)); }

void main(void) {
  srand(uvec3(gl_FragCoord.xy, iFrame));
  highp vec3 dither = vec3(unitrand(), unitrand(), unitrand()) / 512.0;
  // highp vec3 dither = vec3(0.0);
  fragColor = vec4(srgb_gamma(texelFetch(tex, ivec2(gl_FragCoord.xy), 0).xyz) + dither, 1.0); }`);
    gl.compileShader(transfer_fragment_shader);
    const transfer_prog = gl.createProgram();
    if (!transfer_prog) {
        throw new Error("Could not create shader program.");
    }
    gl.attachShader(transfer_prog, quad_vertex_shader);
    gl.attachShader(transfer_prog, transfer_fragment_shader);
    gl.linkProgram(transfer_prog);
    const tex = gl.getUniformLocation(transfer_prog, "tex");
    const iFrame = gl.getUniformLocation(transfer_prog, "iFrame");
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.viewport(0.0, 0.0, canvas.width, canvas.height);
    gl.clearColor(draw_scene.clearColor[0], draw_scene.clearColor[1], draw_scene.clearColor[2], draw_scene.clearColor[3]);
    gl.clearDepth(draw_scene.clearDepth);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    for (const task of draw_scene.tasks) {
        gl.useProgram(task.program.program);
        if (task.program.transform_location) {
            PrepUniformSetterMap.mat4(task.program.transform_location, task.transform);
        }
        for (const uniform of task.uniforms) {
            if (uniform.location !== null) {
                PrepUniformSetterMap[uniform.type](uniform.location, uniform.value);
            }
        }
        for (const attribute of task.attributes) {
            if (attribute.location !== null) {
                gl.enableVertexAttribArray(attribute.location);
                gl.bindBuffer(gl.ARRAY_BUFFER, attribute.buffer);
                gl.vertexAttribPointer(attribute.location, attribute.dimension, attribute.type, false, 0, 0);
                gl.bindBuffer(gl.ARRAY_BUFFER, null);
            }
        }
        if ('indices' in task) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, task.indices);
            gl.drawElements(task.kind, task.count, task.type, 0);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        }
        else {
            gl.drawArrays(task.kind, 0, task.count);
        }
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0.0, 0.0, canvas.width, canvas.height);
    gl.useProgram(transfer_prog);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, target);
    gl.uniform1ui(iFrame, 1);
    gl.uniform1i(tex, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    return canvas;
};
//# sourceMappingURL=diagram.js.map