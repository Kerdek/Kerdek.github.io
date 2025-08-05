import { html_element, pointer_hold } from "./dom.js";
import { axis_angle, mmul, perspective, translate } from "./matrix.js";
// const entries: <K extends string | symbol, E>(e: [K, E][]) => { [i in K]: E } = e =>
// Object.fromEntries(e) as any
const map = (o, f) => Object.fromEntries(Reflect.ownKeys(o).map((sym) => f(sym, o[sym])));
export const create_viewer = (parent) => {
    let spiny = 0.0;
    let spinx = 0.0;
    let standback = 4.0;
    let zoom = 2.5;
    const canvas = html_element('canvas', function () {
        this.style.position = 'absolute';
    }, []);
    const gl = canvas.getContext("webgl2");
    if (gl === null) {
        throw new Error("Unable to initialize WebGL. Your browser or machine may not support it.");
    }
    const PrepTypeMap = {
        short: gl.UNSIGNED_SHORT,
        float: gl.FLOAT
    };
    const PrepArrayTypeMap = {
        short: Uint16Array,
        float: Float32Array
    };
    const PrepShaderTypeMap = {
        vertex: gl.VERTEX_SHADER,
        fragment: gl.FRAGMENT_SHADER
    };
    const PrepTaskKindMap = {
        'triangles': gl.TRIANGLES,
        'triangle strip': gl.TRIANGLE_STRIP,
        'lines': gl.LINES,
        'line strip': gl.LINE_STRIP
    };
    const PrepTextureIdMap = {
        0: gl.TEXTURE0,
        1: gl.TEXTURE1,
        2: gl.TEXTURE2,
        3: gl.TEXTURE3,
        4: gl.TEXTURE4,
        5: gl.TEXTURE5,
        6: gl.TEXTURE6,
        7: gl.TEXTURE7
    };
    const PrepUniformSetterMap = {
        sampler2D: (location, x) => {
            gl.activeTexture(PrepTextureIdMap[x[0]]);
            gl.bindTexture(gl.TEXTURE_2D, x[1]);
            gl.uniform1i(location, x[0]);
        },
        uint: (location, x) => gl.uniform1ui(location, x),
        float: (location, x) => gl.uniform1f(location, x),
        vec3: (location, x) => gl.uniform3f(location, ...x),
        'vec3[]': (location, x) => gl.uniform3fv(location, x.flat()),
        mat4: (location, x) => gl.uniformMatrix4fv(location, false, x)
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
    const resize = (w, h) => {
        canvas.width = w;
        canvas.height = h;
        target = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, target);
        gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, canvas.width, canvas.height);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.bindTexture(gl.TEXTURE_2D, null);
        target_depth = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, target_depth);
        gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT32F, canvas.width, canvas.height);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target, 0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, target_depth, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        invalidate();
    };
    let draw_scene = {
        clearColor: [0.0, 0.0, 0.0, 0.0],
        clearDepth: 0.0,
        tasks: []
    };
    const update = (prep) => {
        const draw_buffers = map(prep.buffers, (sym, buffer) => {
            const buf = gl.createBuffer();
            if (!buf) {
                throw new Error("Could not create vertex buffer.");
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
        });
        const draw_shaders = map(prep.shaders, (sym, shader) => {
            const shad = gl.createShader(PrepShaderTypeMap[shader.type]);
            if (!shad) {
                throw new Error("Could not create vertex shader.");
            }
            gl.shaderSource(shad, shader.text);
            gl.compileShader(shad);
            return [sym, shad];
        });
        const draw_programs = map(prep.programs, (sym, program) => {
            const prog = gl.createProgram();
            if (!prog) {
                throw new Error("Could not create shader program.");
            }
            const v = draw_shaders[program.vertex_shader];
            if (!v) {
                throw new Error("Specified vertex shader not found.");
            }
            const f = draw_shaders[program.fragment_shader];
            if (!f) {
                throw new Error("Specified fragment shader not found.");
            }
            gl.attachShader(prog, v);
            gl.attachShader(prog, f);
            gl.linkProgram(prog);
            return [sym, {
                    program: prog,
                    transform_location: gl.getUniformLocation(prog, program.transform_name)
                }];
        });
        const draw_textures = map(prep.textures, (sym, texture) => {
            const tex = gl.createTexture();
            if (!tex) {
                throw new Error("Unable to create texture.");
            }
            gl.bindTexture(gl.TEXTURE_2D, tex);
            if ('image' in texture) {
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texture.image.width, texture.image.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
            }
            else {
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, texture.width, texture.height, 0, gl.RGBA, gl.FLOAT, texture.data);
            }
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.bindTexture(gl.TEXTURE_2D, null);
            return [sym, tex];
        });
        draw_scene = {
            clearColor: prep.clearColor,
            clearDepth: prep.clearDepth,
            tasks: prep.tasks.map(task => {
                const prog = draw_programs[task.program];
                if (!prog) {
                    throw new Error("Specified program not found.");
                }
                let texture_index = 0;
                return {
                    program: prog,
                    uniforms: task.uniforms.map(uniform => {
                        const location = gl.getUniformLocation(prog.program, uniform.name);
                        switch (uniform.type) {
                            case 'sampler2D': {
                                const value = draw_textures[uniform.value];
                                if (!value) {
                                    throw new Error("Specified texture not found.");
                                }
                                return {
                                    location,
                                    type: uniform.type,
                                    value: [texture_index++, value]
                                };
                            }
                            case 'uint': return {
                                location,
                                type: uniform.type,
                                value: uniform.value
                            };
                            case 'float': return {
                                location,
                                type: uniform.type,
                                value: uniform.value
                            };
                            case 'vec3': return {
                                location,
                                type: uniform.type,
                                value: uniform.value
                            };
                            case 'vec3[]': return {
                                location,
                                type: uniform.type,
                                value: uniform.value
                            };
                            case 'mat4': return {
                                location,
                                type: uniform.type,
                                value: uniform.value
                            };
                        }
                    }),
                    attributes: task.attributes.map(attribute => {
                        const buffer = draw_buffers[attribute.buffer];
                        if (!buffer) {
                            throw new Error("Specified buffer not found.");
                        }
                        const desc = prep.buffers[attribute.buffer];
                        if (!desc) {
                            throw new Error("Specified buffer not found.");
                        }
                        const location = gl.getAttribLocation(prog.program, attribute.name);
                        return {
                            location,
                            size: attribute.size,
                            type: PrepTypeMap[desc.type],
                            buffer
                        };
                    }),
                    ...'indices' in task ? (() => {
                        const buffer = draw_buffers[task.indices];
                        if (!buffer) {
                            throw new Error("Specified buffer not found.");
                        }
                        const desc = prep.buffers[task.indices];
                        if (!desc) {
                            throw new Error("Specified buffer descriptor not found.");
                        }
                        return {
                            indices: buffer,
                            type: PrepTypeMap[desc.type]
                        };
                    })() : {},
                    count: task.count,
                    kind: PrepTaskKindMap[task.kind]
                };
            })
        };
        invalidate();
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
    let frame = 0;
    const render = () => {
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.viewport(0.0, 0.0, canvas.width, canvas.height);
        gl.clearColor(...draw_scene.clearColor);
        gl.clearDepth(draw_scene.clearDepth);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        const transform = mmul(axis_angle([0.0, 1.0, 0.0], spinx), mmul(axis_angle([1.0, 0.0, 0.0], spiny), translate([0.0, 0.0, -standback])));
        const all = mmul(transform, perspective(zoom, canvas.width, canvas.height));
        for (const task of draw_scene.tasks) {
            gl.useProgram(task.program.program);
            gl.uniformMatrix4fv(task.program.transform_location, false, all);
            for (const uniform of task.uniforms) {
                if (uniform.location !== null) {
                    PrepUniformSetterMap[uniform.type](uniform.location, uniform.value);
                }
            }
            for (const attribute of task.attributes) {
                if (attribute.location !== null) {
                    gl.enableVertexAttribArray(attribute.location);
                    gl.bindBuffer(gl.ARRAY_BUFFER, attribute.buffer);
                    gl.vertexAttribPointer(attribute.location, attribute.size, attribute.type, false, 0, 0);
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
        gl.uniform1ui(iFrame, frame++);
        gl.uniform1i(tex, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    let valid = false;
    let running = true;
    const animate = () => {
        if (!valid) {
            valid = true;
            render();
            requestAnimationFrame(animate);
        }
        else {
            running = false;
        }
    };
    animate();
    const invalidate = () => {
        valid = false;
        if (!running) {
            running = true;
            animate();
        }
    };
    canvas.addEventListener('pointerdown', e => {
        if (e.button === 0) {
            pointer_hold(canvas, 0, e.pointerId, true, e => {
                spinx += 0.01 * e.movementX;
                spiny += 0.01 * e.movementY;
                invalidate();
            });
        }
    });
    canvas.addEventListener('wheel', e => {
        const delta = e.deltaY / 1000.0;
        if (e.shiftKey) {
            zoom *= Math.exp(-delta);
        }
        else {
            standback *= Math.exp(delta);
        }
        invalidate();
    });
    parent.appendChild(canvas);
    new ResizeObserver(() => {
        const w = Math.ceil(parent.clientWidth);
        const h = Math.ceil(parent.clientHeight);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        resize(w * devicePixelRatio, h * devicePixelRatio);
    })
        .observe(parent);
    return update;
};
//# sourceMappingURL=viewer.js.map