import { Evaluate, Fatal, GraphProcess, make, pretty, reduce, visit } from './church.js'
import { get_builtin } from './builtin.js'
import { homproc, jmp } from '../run.js'

export const evaluate: Evaluate = e => homproc((call, ret) => {
const fatal: Fatal = m => { throw new Error(m) }
const s: GraphProcess = visit({
  app: e => call(s(e[1]), dx => jmp(visit({
    abs: ([, i, o, x]) => o === "lazy" ? jmp(s(make("ext", i, make(e[2]), x))) : call(s(e[2]), dy => jmp(s(make("ext", i, make(dy), x)))),
    blt: ([, r]) => r(call, ret, s, fatal, e[2]),
    lit: ([, r]) => fatal(`Cannot apply literal \`${JSON.stringify(r)}\` to \`${pretty(e[2])}\`.`) })(dx))),
  ext: e => jmp(s(reduce(e))),
  elm: e => jmp(s(e[2])),
  ind: e => call(s(e[1][0]), dx => (e[1][0] = dx, ret(dx))),
  ref: ([, i]) => (r => r ? ret(r) : fatal(`No known built-in named \`${i}\`.`))(get_builtin[i]),
  abs: ret, lit: ret, blt: ret })
return s(e) })
