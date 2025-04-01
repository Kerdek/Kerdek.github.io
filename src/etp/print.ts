import { homproc } from "./run.js"
import { Goals, Prop, Sorts, visit } from "./lang.js"

const parens = (c: boolean, s: string) => c ? `(${s})` : s

export const print_prop: (e: Prop, b: boolean) => string = (e, b) => homproc((call, _cc, ret) => {
type RealWorld = ReturnType<typeof ret>
const p: (e: Sorts['all']) => () => RealWorld = e => () => e.body.kind === "all" ? (x => call(p(x), dx => ret(` ${x.id}${dx}`)))(e.body) : call(s(e.body)(0, true), dx => ret(`.${dx}`))
const t: (e: Prop) => (p: number, r: boolean) => RealWorld = visit({
  all: e => (_p, r) => call(p(e), dx => ret(parens(!r, `\\${e.id}${dx}`))),
  imp: ({ lhs, rhs }) => (p, r) => call(s(lhs)(1, false), dx => call(s(rhs)(0, p > 0 || r), dy => ret(parens(p > 0, `${dx} -> ${dy}`)))),
  app: ({ lhs, rhs }) => (p, r) => call(s(lhs)(1, false), dx => call(s(rhs)(2, p > 1 || r), dy => ret(parens(p > 1, `${dx} ${dy}`)))),
  ref: ({ id }) => (_p, _r) => ret(id) })
const s = (e : Prop) => (p: number, r: boolean) => () => t(e)(p, r)
return b ? s(e)(2, false)() : s(e)(0, true)() })

export const print_goals: (g: Goals) => string = g => {
const o: string[] = []
for (const gp of g) {
  o.push([
    ...gp.scope.props.size === 0 ? [] : [[...gp.scope.props].join(' ')],
    ...Object.keys(gp.scope.proofs).map(k => `${k} : ${print_prop(gp.scope.proofs[k] as Prop, false)}`),
    `⊢ ${print_prop(gp.prop, false)}`].join('\n'))}
return o.join('\n\n') }
