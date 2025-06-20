import { homproc } from "./run.js"
import { Scope, Sorts, Term, visit } from "./church.js"

const parens = (c: boolean, s: string) => c ? `(${s})` : s

export const print: (e: Term) => string = e => homproc((call, _cc, ret) => {
type RealWorld = ReturnType<typeof ret>
const p: (e: Sorts['abs']) => () => RealWorld = e => () => e.body.kind === "abs" ? (x => call(p(x), dx => ret(` ${x.id}${dx}`)))(e.body) : call(s(e.body)(0, true), dx => ret(`.${dx}`))
const t: (e: Term) => (p: number, r: boolean) => RealWorld = visit({
  app: ({ lhs, rhs }) => (p, r) => call(s(lhs)(1, false), dx => call(s(rhs)(2, p > 1 || r), dy => ret(parens(p > 1, `${dx} ${dy}`)))),
  abs: e => (_p, r) => call(p(e), dx => ret(parens(!r, `λ${e.id}${dx}`))),
  imp: ({ lhs, rhs }) => (p, r) => call(s(lhs)(1, false), dx => call(s(rhs)(0, p > 0 || r), dy => ret(parens(p > 0, `${dx} -> ${dy}`)))),
  ref: ({ id }) => (_p, _r) => ret(id) })
const s = (e : Term) => (p: number, r: boolean) => () => t(e)(p, r)
return s(e)(0, true)() })

export const print_scope: (o: Scope) => string = o => `{ ${Object.keys(o).map(k => `${k}: ${print(o[k] as Term)}`).join(', ')} }`