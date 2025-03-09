import { Record, visit, Graph, Value } from './church.js'
import { get_builtin } from './builtin.js'
import { stam } from '../stam.js'

const fatal: (m: string) => never = m => { throw new Error(m) }

export const evaluate = stam<[Graph, Record], Value>((rec, rc, ret) => {
type Branch = ReturnType<typeof ret>
const table: (e: Graph, o: Record) => Branch = visit({
  app: ({ lhs, rhs }, o) =>
    rec([lhs, o], dx =>
    typeof dx !== "function" ? fatal(`Expected a function.`) :
    dx({ kind: "ext", defs: o, body: rhs })(rec, rc, ret)),
  ext: ({ defs, body }, o) => rc([body, { ...o, ...defs }]),
  shr: (e, _o) => 'value' in e ? ret(e.value) : rec([e.body, {}], dx => (e.value = dx, ret(dx))),
  abs: ({ param, body }, o) => ret(a => (_rec, cc, _ret) => cc([body, { ...o, [param]: { kind: "shr", body: a } }])),
  ref: ({ id }, o) =>
    (r => r ? rc([r, {}]) :
    (r => r !== undefined ? ret(r) :
    fatal(`Undefined reference to \`${id}\`.`))(get_builtin[id]))(o[id]),
  lit: ({ value }, _o) => ret(value) })
return ([e, o]) => () => table(e, o) })