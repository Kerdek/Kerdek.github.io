import { visit, Graph } from './church.js'
import { stam } from '../stam.js'

const fatal: (m: string) => never = m => { throw new Error(m) }

export const beta = (i: string, x: Graph) => stam<Graph, Graph>((rec, _rc, ret) => {
type Branch = ReturnType<typeof ret>
const table: (e: Graph) => Branch = visit({
  shr: ret,
  app: e => rec(e.lhs, dx => rec(e.rhs, dy => ret(dx === e.lhs && dy === e.rhs ? e : { kind: "app", lhs: dx, rhs: dy }))),
  abs: e => i === e.param ? ret(e) : rec(e.body, dx => ret({ kind: "abs", param: e.param, body: dx })),
  ref: e => (ret(i === e.id ? x : e)) })
return e => () => table(e) })

export const evaluate = stam<Graph, Graph>((rec, rc, ret) => {
type Branch = ReturnType<typeof ret>
const table: (e: Graph) => Branch = visit({
  shr: e => 'value' in e ? ret(e.value) : rec(e.body, dx => (e.value = dx, ret(dx))),
  app: ({ lhs, rhs }) => rec(lhs, dx =>
    dx.kind === "abs" ? rc(beta(dx.param, { kind: "shr", body: rhs })((_rec, rc, _ret) => rc(dx.body))) :
    fatal("Not a function.")),
  abs: ret,
  ref: ({ id }) => fatal(`Undefined reference to \`${id}\`.`) })
return e => () => table(e) })