export const ujs_load = async (wasm_url) => {
    // const include: (src: string) => Promise<Event> =
    // src => new Promise(cb => {
    //   const js = document.createElement('script')
    //   js.src = src
    //   js.type = 'text/javascript'
    //   js.addEventListener('load', cb)
    //   document.head.appendChild(js) })
    const [local, term, get, drop] = (() => {
        const terms = {};
        const locals = {};
        let counter = 1;
        const reuse = new Set();
        const pickone = () => {
            for (const n of reuse) {
                reuse.delete(n);
                return n;
            }
            return counter++;
        };
        const local = e => {
            const a = pickone();
            locals[a] = e;
            terms[a] = [locals, a];
            return a;
        };
        const term = js => {
            const a = pickone();
            terms[a] = js;
            return a;
        };
        const get = a => terms[a];
        const drop = a => {
            const [o, i] = terms[a];
            if (o === locals) {
                delete o[i];
            }
            reuse.add(a);
            delete terms[a];
        };
        return [local, term, get, drop];
    })();
    const c_to_string8 = (p, n) => new TextDecoder('utf8').decode(new Uint8Array(memory.buffer, p, n));
    const c_to_string16 = (p, n) => new TextDecoder('utf16').decode(new Uint16Array(memory.buffer, p, n));
    const read = ([o, i]) => o[i];
    const assign = ([o, i], [p, j]) => { o[i] = p[j]; };
    const assign_add = ([o, i], [p, j]) => { o[i] += p[j]; };
    const assign_sub = ([o, i], [p, j]) => { o[i] -= p[j]; };
    const assign_mul = ([o, i], [p, j]) => { o[i] *= p[j]; };
    const assign_div = ([o, i], [p, j]) => { o[i] /= p[j]; };
    const assign_mod = ([o, i], [p, j]) => { o[i] %= p[j]; };
    const assign_and = ([o, i], [p, j]) => { o[i] &= p[j]; };
    const assign_or = ([o, i], [p, j]) => { o[i] |= p[j]; };
    const assign_xor = ([o, i], [p, j]) => { o[i] ^= p[j]; };
    const assign_shl = ([o, i], [p, j]) => { o[i] <<= p[j]; };
    const assign_shr = ([o, i], [p, j]) => { o[i] >>= p[j]; };
    const call = (a, b, c) => read(get(a))(...[...new Uint32Array(memory.buffer, c, b)].map(x => read(get(x))));
    const neew = (a, b, c) => new (read(get(a)))(...[...new Uint32Array(memory.buffer, c, b)].map(x => read(get(x))));
    const delet = ([o, i]) => delete o[i];
    const wrap_value = (f) => local((...x) => {
        const s = f(local(x));
        const z = read(get(s));
        drop(s);
        return z;
    });
    const wrap_void = (f) => local((...x) => {
        f(local(x));
    });
    const exports = (await WebAssembly.instantiate(await (await fetch(wasm_url)).arrayBuffer(), {
        wasi_snapshot_preview1: {
            proc_exit: (...x) => { console.log(...x); }
        },
        env: {
            js_log: (p, n) => {
                console.log(c_to_string8(p, n));
            },
            js_drop: drop,
            js_copy: (x) => local(read(get(x))),
            js_value_closure: (i, f) => wrap_value((x) => invoke_value(i, f, x)),
            js_void_closure: (i, f) => wrap_void((x) => invoke_void(i, f, x)),
            js_new_object: () => local({}),
            js_new_array: () => local([]),
            js_numberusize: (n) => local(n),
            js_numberull: (n) => local(n),
            js_numberf32: (n) => local(n),
            js_numberf64: (n) => local(n),
            js_string8: (p, n) => local(c_to_string8(p, n)),
            js_string16: (p, n) => local(c_to_string16(p, n)),
            js_boolean: (n) => local(n),
            js_null: () => local(null),
            js_undefined: () => local(undefined),
            js_get_double: (a) => read(get(a)),
            js_get_ulong: (a) => read(get(a)),
            js_get_long: (a) => read(get(a)),
            js_get_boolean: (a) => read(get(a)),
            js_window: () => local(window),
            js_eval: (a => local(eval(read(get(a))))),
            js_typeof: (a => local(typeof read(get(a)))),
            js_new: (a, b, c) => local(neew(a, b, c)),
            js_delete: (a => local(delet(get(a)))),
            js_call: (a, b, c) => local(call(a, b, c)),
            js_elem: ((a, b) => term([read(get(a)), read(get(b))])),
            js_pos: (a => local(+read(get(a)))),
            js_neg: (a => local(-read(get(a)))),
            js_not: (a => local(!read(get(a)))),
            js_cmp: (a => local(~read(get(a)))),
            js_add: ((a, b) => local(read(get(a)) + read(get(b)))),
            js_sub: ((a, b) => local(read(get(a)) - read(get(b)))),
            js_mul: ((a, b) => local(read(get(a)) * read(get(b)))),
            js_div: ((a, b) => local(read(get(a)) / read(get(b)))),
            js_mod: ((a, b) => local(read(get(a)) % read(get(b)))),
            js_and: ((a, b) => local(read(get(a)) & read(get(b)))),
            js_or: ((a, b) => local(read(get(a)) | read(get(b)))),
            js_xor: ((a, b) => local(read(get(a)) ^ read(get(b)))),
            js_shl: ((a, b) => local(read(get(a)) << read(get(b)))),
            js_shr: ((a, b) => local(read(get(a)) >> read(get(b)))),
            js_gt: ((a, b) => local(read(get(a)) > read(get(b)))),
            js_lt: ((a, b) => local(read(get(a)) < read(get(b)))),
            js_ge: ((a, b) => local(read(get(a)) >= read(get(b)))),
            js_le: ((a, b) => local(read(get(a)) <= read(get(b)))),
            js_ee: ((a, b) => local(read(get(a)) == read(get(b)))),
            js_nn: ((a, b) => local(read(get(a)) != read(get(b)))),
            js_eee: ((a, b) => local(read(get(a)) === read(get(b)))),
            js_nnn: ((a, b) => local(read(get(a)) !== read(get(b)))),
            js_asse: ((a, b) => (assign(get(a), get(b)), term(get(a)))),
            js_adde: ((a, b) => (assign_add(get(a), get(b)), term(get(a)))),
            js_sube: ((a, b) => (assign_sub(get(a), get(b)), term(get(a)))),
            js_mule: ((a, b) => (assign_mul(get(a), get(b)), term(get(a)))),
            js_dive: ((a, b) => (assign_div(get(a), get(b)), term(get(a)))),
            js_mode: ((a, b) => (assign_mod(get(a), get(b)), term(get(a)))),
            js_ande: ((a, b) => (assign_and(get(a), get(b)), term(get(a)))),
            js_ore: ((a, b) => (assign_or(get(a), get(b)), term(get(a)))),
            js_xore: ((a, b) => (assign_xor(get(a), get(b)), term(get(a)))),
            js_shle: ((a, b) => (assign_shl(get(a), get(b)), term(get(a)))),
            js_shre: ((a, b) => (assign_shr(get(a), get(b)), term(get(a))))
        }
    })).instance.exports;
    const invoke_void = exports.invoke_void;
    const invoke_value = exports.invoke_value;
    const memory = exports.memory;
    return exports;
};
//# sourceMappingURL=ujs.js.map