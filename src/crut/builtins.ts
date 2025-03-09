import { abs, blt, iov, Lit, Normal, term_blt, term_iov, term_lit, Literal, rec } from "./graph.js"
import { evaluate_root } from "./evaluate.js"
import { jmp } from "./run.js"

export type Builtins = { [i: string]: Normal }

export const builtins: Builtins = (() => {
const nullary: (op: Literal) => Normal = op => term_lit(op)
const unary: (op: (x: any) => Literal) => Normal = op => term_blt(r => (call, ret) => () =>
  call(evaluate_root(r)(call, ret), dx =>
  ret(nullary(op((dx as Lit).value)))))
const binary: (op: (x: any, y: any) => Literal) => Normal = op => term_blt(r => (call, ret) => () =>
  call(evaluate_root(r)(call, ret), dx =>
  ret(unary(y => op((dx as Lit).value, y)))))
const ternary: (op: (x: any, y: any, z: any) => Literal) => Normal = op => term_blt(r => (call, ret) => () =>
  call(evaluate_root(r)(call, ret), dx =>
  ret(binary((x, y) => op((dx as Lit).value, x, y)))))
return {
__builtin_return:
  term_blt(a => (_call, ret) => () => ret(term_iov("return", [a]))),
__builtin_bind:
  term_blt(a => (_call, ret) => () => ret(term_blt(b => (_call, ret) => () => ret(term_iov("bind", [a, b]))))),
__builtin_puts:
  term_blt(a => (_call, ret) => () => ret(term_iov("puts", [a]))),
__builtin_new:
  term_blt(a => (_call, ret) => () => ret(term_iov("new", [a]))),
__builtin_get:
  term_blt(a => (_call, ret) => () => ret(term_iov("get", [a]))),
__builtin_set:
  term_blt(a => (_call, ret) => () => ret(term_blt(b => (_call, ret) => () => ret(term_iov("set", [a, b]))))),
__builtin_if:
  term_blt(a => (_call, ret) => () =>
  ret(term_blt(b => (_call, ret) => () =>
  ret(term_blt(c => (call, _ret) => () =>
  call(evaluate_root(a)(call, ret), da =>
  jmp(evaluate_root((da as Lit).value ? b : c)(call, ret)))))))),
__builtin_typeof:
  term_blt(r => (call, ret) => () =>
  call(evaluate_root(r)(call, ret), dx =>
  ret(term_lit(
    dx.kind === abs || dx.kind === blt ? "function" :
    dx.kind === iov ? "io" :
    dx.kind === rec ? "record" :
    typeof dx.value)))),
__builtin_length: unary(x => x.length),
__builtin_slice: ternary((x, y, z) => x.slice(y, z)),
__builtin_cat: binary((a, b) => a + b),
__builtin_neg: unary(x => -x),
__builtin_not: unary(x => !x),
__builtin_cpl: unary(x => ~x),
__builtin_mul: binary((a, b) => a * b),
__builtin_div: binary((a, b) => a / b),
__builtin_mod: binary((a, b) => a % b),
__builtin_add: binary((a, b) => a + b),
__builtin_sub: binary((a, b) => a - b),
__builtin_shl: binary((a, b) => a << b),
__builtin_shr: binary((a, b) => a >> b),
__builtin_eq: binary((a, b) => a === b),
__builtin_neq: binary((a, b) => a !== b),
__builtin_gt: binary((a, b) => a > b),
__builtin_ge: binary((a, b) => a >= b),
__builtin_lt: binary((a, b) => a < b),
__builtin_le: binary((a, b) => a <= b),
__builtin_bcj: binary((a, b) => a & b),
__builtin_bxj: binary((a, b) => a ^ b),
__builtin_bdj: binary((a, b) => a | b),
__builtin_floor: unary(Math.floor),
__builtin_ceil: unary(Math.ceil),
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
__builtin_stringify: unary(JSON.stringify), } })()
