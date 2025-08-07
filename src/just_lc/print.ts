import { homproc } from "../run.js"
import { Graph, Sorts, visit } from "./church.js"

const parens = (b: boolean, s: string) => b ? `(${s})` : s

export const print: (e: Graph) => string = e => homproc((call, cc, ret) => {
const p = ({ body }: Sorts['abs']) => () => body.kind === 'abs' ? call(p(body), dx => ret(` ${body.param}${dx}`)) : call(s(body, false, true), dx => ret(`.${dx}`))
const s = (e: Graph, pr: boolean, rm: boolean) => () => visit({
  abs: e => call(p(e), dx => ret(parens(!rm, `λ${e.param}${dx}`))),
  app: ({ lhs, rhs }) => call(s(lhs, false, false), dx => call(s(rhs, true, pr || rm), dy => ret(parens(pr, `${dx} ${dy}`)))),
  ref: ({ id }) => ret(id),
  shr: e => cc(s('value' in e ? e.value : e.body, pr, rm)) })(e)
return s(e, false, true) })