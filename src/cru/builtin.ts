import { Builtins, Graph, make, Value } from "./cru.js"

export const get_builtin: Builtins = await (async () => {
const nullary: (op: any) => Value = op => op
const unary: (op: (x: any) => any) => Value = op => r => (rec, _cc, ret) =>
  rec(r, dx =>
  ret(op(dx)))
const binary: (op: (x: any, y: any) => any) => Value = op => x => (_rec, _cc, ret) =>
  ret(y => (rec, _cc, ret) =>
  rec(x, dx =>
  rec(y, dy =>
  ret(op(dx, dy)))))
const ternary: (op: (x: any, y: any, z: any) => any) => Value = op => x => (_rec, _cc, ret) =>
  ret(y => (_rec, _cc, ret) =>
  ret(z => (rec, _cc, ret) =>
  rec(x, dx =>
  rec(y, dy =>
  rec(z, dz =>
  ret(op(dx, dy, dz)))))))
return {
  __builtin_typeof: r => (rec, _rc, ret) => rec(r, dx => ret(Array.isArray(dx) ? "tuple" : typeof dx === "object" ? "record" : typeof dx)),
  __builtin_slen: unary(x => x.length),
  __builtin_tlen: unary(x => x.length),
  __builtin_keys: unary(x => Object.keys(x).map(x => make("shr", make("lit", x), x) )),
  __builtin_tslice: ternary((x, y, z) => x.slice(y, z)),
  __builtin_sslice: ternary((x, y, z) => x.slice(y, z)),
  __builtin_rec: r => (_rec, cc, _ret) => (e => (e[2] = e, cc(e)))(make("app", r, undefined as unknown as Graph)),
  __builtin_if: r => (rec, _cc, ret) => rec(r, dx => ret(a => (_rec, _cc, ret) => ret(b => (_rec, cc, _ret) => cc(dx ? a : b)))),
  __builtin_add: binary((a, b) => a + b),
  __builtin_sub: binary((a, b) => a - b),
  __builtin_mul: binary((a, b) => a * b),
  __builtin_div: binary((a, b) => a / b),
  __builtin_eq: binary((a, b) => a === b),
  __builtin_neq: binary((a, b) => a !== b),
  __builtin_gt: binary((a, b) => a > b),
  __builtin_lt: binary((a, b) => a < b),
  __builtin_ge: binary((a, b) => a >= b),
  __builtin_le: binary((a, b) => a <= b),
  __builtin_elem: binary((a, b) => a[b]),
  __builtin_pi: nullary(Math.PI),
  __builtin_sqrt: unary(Math.sqrt),
  __builtin_log: unary(Math.log),
  __builtin_pow: binary(Math.pow),
  __builtin_exp: unary(Math.exp),
  __builtin_cos: unary(Math.cos),
  __builtin_sin: unary(Math.sin),
  __builtin_tan: unary(Math.tan),
  __builtin_acos: unary(Math.acos),
  __builtin_asin: unary(Math.asin),
  __builtin_atan: unary(Math.atan),
  __builtin_atan2: binary(Math.atan2),
  __builtin_cosh: unary(Math.cosh),
  __builtin_sinh: unary(Math.sinh),
  __builtin_tanh: unary(Math.tanh),
  __builtin_acosh: unary(Math.acosh),
  __builtin_asinh: unary(Math.asinh),
  __builtin_atanh: unary(Math.atanh),
  __builtin_sempty: unary(x => x.length === 0),
  __builtin_shead: unary(x => x[0]),
  __builtin_stail: unary(x => x.substring(1)),
  __builtin_stringify: unary(JSON.stringify),
  __builtin_document: nullary(document),
  __builtin_console: nullary(console),
  __builtin_WebSocket: nullary(WebSocket) } })()
