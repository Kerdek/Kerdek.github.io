export const ujs_load = async (wasm_url: string) => {

// const include: (src: string) => Promise<Event> =
// src => new Promise(cb => {
//   const js = document.createElement('script')
//   js.src = src
//   js.type = 'text/javascript'
//   js.addEventListener('load', cb)
//   document.head.appendChild(js) })

const [local, term, get, drop] = (() => {
  const terms: { [i: number]: JS } = {}
  const locals: { [i: string | number | symbol]: any } = {}
  let counter = 1
  const reuse = new Set<number>()
  const pickone = () => {
    for (const n of reuse) {
      reuse.delete(n)
      return n }
    return counter++ }
  const local: (e: any) => number = e => {
    const a = pickone()
    locals[a] = e
    terms[a] = [locals, a]
    return a }
  const term: (js: JS) => number = js => {
    const a = pickone()
    terms[a] = js
    return a }
  const get: (i: number) => JS = a => terms[a] as JS
  const drop: (i: number) => void = a => {
    const [o, i] = terms[a] as JS
    if (o === locals) {
      delete o[i] }
    reuse.add(a);
    delete terms[a] }
  return [local, term, get, drop] })()

const c_to_string8 = (p: number, n: number) =>
  new TextDecoder('utf8').decode(new Uint8Array(memory.buffer, p, n))

const c_to_string16 = (p: number, n: number) =>
  new TextDecoder('utf16').decode(new Uint16Array(memory.buffer, p, n))

type Unop = (i: number) => number
type Binop = (i: number, j: number) => number
type JS = [{ [i: string | number | symbol]: any }, string | number | symbol]

const read: (js: JS) => any = ([o, i]) => o[i]
const assign: (jsa: JS, jsb: JS) => void = ([o, i], [p, j]) => { o[i] = p[j] }
const assign_add: (jsa: JS, jsb: JS) => void = ([o, i], [p, j]) => { o[i] += p[j] }
const assign_sub: (jsa: JS, jsb: JS) => void = ([o, i], [p, j]) => { o[i] -= p[j] }
const assign_mul: (jsa: JS, jsb: JS) => void = ([o, i], [p, j]) => { o[i] *= p[j] }
const assign_div: (jsa: JS, jsb: JS) => void = ([o, i], [p, j]) => { o[i] /= p[j] }
const assign_mod: (jsa: JS, jsb: JS) => void = ([o, i], [p, j]) => { o[i] %= p[j] }
const assign_and: (jsa: JS, jsb: JS) => void = ([o, i], [p, j]) => { o[i] &= p[j] }
const assign_or: (jsa: JS, jsb: JS) => void = ([o, i], [p, j]) => { o[i] |= p[j] }
const assign_xor: (jsa: JS, jsb: JS) => void = ([o, i], [p, j]) => { o[i] ^= p[j] }
const assign_shl: (jsa: JS, jsb: JS) => void = ([o, i], [p, j]) => { o[i] <<= p[j] }
const assign_shr: (jsa: JS, jsb: JS) => void = ([o, i], [p, j]) => { o[i] >>= p[j] }
const call: (a: number, b: number, c: number) => any = (a, b, c) => read(get(a))(...[...new Uint32Array(memory.buffer, c, b)].map(x => read(get(x))))
const neew: (a: number, b: number, c: number) => any = (a, b, c) => new (read(get(a)))(...[...new Uint32Array(memory.buffer, c, b)].map(x => read(get(x))))
const delet: (js: JS) => any = ([o, i]) => delete o[i]

const wrap_value = (f: (x: any) => number) => local((...x: any[]) => {
  const s = f(local(x))
  const z = read(get(s))
  drop(s)
  return z })

const wrap_void = (f: (x: any) => void) => local((...x: any[]) => {
  f(local(x)) })

const exports = (await WebAssembly.instantiate(await (await fetch(wasm_url)).arrayBuffer(), {
wasi_snapshot_preview1: {
  proc_exit: (...x: any[]) => { console.log(...x) } },
env: {
  js_log: (p: number, n: number) => {
    console.log(c_to_string8(p, n)) },
  js_drop: drop,
  js_copy: (x: number) => local(read(get(x))),

  js_value_closure: (i: number, f: number) => wrap_value((x: any) => invoke_value(i, f, x)) ,
  js_void_closure: (i: number, f: number) => wrap_void((x: any) => invoke_void(i, f, x)) ,

  js_new_object: () => local({}),
  js_new_array: () => local([]),
  js_numberusize: (n: number) => local(n),
  js_numberull: (n: number) => local(n),
  js_numberf32: (n: number) => local(n),
  js_numberf64: (n: number) => local(n),
  js_string8: (p: number, n: number) => local(c_to_string8(p, n)),
  js_string16: (p: number, n: number) => local(c_to_string16(p, n)),
  js_boolean: (n: boolean) => local(n),
  js_null: () => local(null),
  js_undefined: () => local(undefined),

  js_get_double: (a: number) => read(get(a)),
  js_get_ulong: (a: number) => read(get(a)),
  js_get_long: (a: number) => read(get(a)),
  js_get_boolean: (a: number) => read(get(a)),

  js_window: () => local(window),
  js_eval: <Unop>(a => local(eval(read(get(a))))),

  js_typeof: <Unop>(a => local(typeof read(get(a)))),

  js_new: (a: number, b: number, c: number) => local(neew(a, b, c)),
  js_delete: <Unop>(a => local(delet(get(a)))),

  js_call: (a: number, b: number, c: number) => local(call(a, b, c)),
  js_elem: <Binop>((a, b) => term([read(get(a)), read(get(b))])),

  js_pos: <Unop>(a => local(+read(get(a)))),
  js_neg: <Unop>(a => local(-read(get(a)))),
  js_not: <Unop>(a => local(!read(get(a)))),
  js_cmp: <Unop>(a => local(~read(get(a)))),
  js_add: <Binop>((a, b) => local(read(get(a)) + read(get(b)))),
  js_sub: <Binop>((a, b) => local(read(get(a)) - read(get(b)))),
  js_mul: <Binop>((a, b) => local(read(get(a)) * read(get(b)))),
  js_div: <Binop>((a, b) => local(read(get(a)) / read(get(b)))),
  js_mod: <Binop>((a, b) => local(read(get(a)) % read(get(b)))),
  js_and: <Binop>((a, b) => local(read(get(a)) & read(get(b)))),
  js_or: <Binop>((a, b) => local(read(get(a)) | read(get(b)))),
  js_xor: <Binop>((a, b) => local(read(get(a)) ^ read(get(b)))),
  js_shl: <Binop>((a, b) => local(read(get(a)) << read(get(b)))),
  js_shr: <Binop>((a, b) => local(read(get(a)) >> read(get(b)))),
  js_gt: <Binop>((a, b) => local(read(get(a)) > read(get(b)))),
  js_lt: <Binop>((a, b) => local(read(get(a)) < read(get(b)))),
  js_ge: <Binop>((a, b) => local(read(get(a)) >= read(get(b)))),
  js_le: <Binop>((a, b) => local(read(get(a)) <= read(get(b)))),
  js_ee: <Binop>((a, b) => local(read(get(a)) == read(get(b)))),
  js_nn: <Binop>((a, b) => local(read(get(a)) != read(get(b)))),
  js_eee: <Binop>((a, b) => local(read(get(a)) === read(get(b)))),
  js_nnn: <Binop>((a, b) => local(read(get(a)) !== read(get(b)))),
  js_asse: <Binop>((a, b) => (assign(get(a), get(b)), term(get(a)))),
  js_adde: <Binop>((a, b) => (assign_add(get(a), get(b)), term(get(a)))),
  js_sube: <Binop>((a, b) => (assign_sub(get(a), get(b)), term(get(a)))),
  js_mule: <Binop>((a, b) => (assign_mul(get(a), get(b)), term(get(a)))),
  js_dive: <Binop>((a, b) => (assign_div(get(a), get(b)), term(get(a)))),
  js_mode: <Binop>((a, b) => (assign_mod(get(a), get(b)), term(get(a)))),
  js_ande: <Binop>((a, b) => (assign_and(get(a), get(b)), term(get(a)))),
  js_ore : <Binop>((a, b) => (assign_or(get(a), get(b)), term(get(a)))),
  js_xore: <Binop>((a, b) => (assign_xor(get(a), get(b)), term(get(a)))),
  js_shle: <Binop>((a, b) => (assign_shl(get(a), get(b)), term(get(a)))),
  js_shre: <Binop>((a, b) => (assign_shr(get(a), get(b)), term(get(a)))) } })).instance.exports

const invoke_void = exports.invoke_void as (i: number, f: number, x: number) => void
const invoke_value = exports.invoke_value as (i: number, f: number, x: number) => number
const memory = exports.memory as WebAssembly.Memory

return exports }