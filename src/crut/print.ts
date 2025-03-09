import { Inequalities } from "./constraints.js"
import { di } from "./di.js"
import { abs, acs, any, app, blt, bol, cnj, dsj, Graph, iov, lit, mod, num, rec, sav, aka, str, TypeTree, unk, visit_graph, visit_type, ref, res, TypeMap, Record, Ptr, cst, ext } from "./graph.js"
import { pretty_vars } from "./pretty_vars.js"
import { homproc, jmp, Process } from "./run.js"

type PrintType = (e: TypeTree) => string
type PrintTerm = (e: Graph) => string

type TupleTypePrintProcess = (a: TypeTree[], d: number) => Process
type RecordTypePrintProcess = (a: TypeMap, k: string[], r: string[], d: number) => Process
type TypePrintProcess = (e: TypeTree, pr: number, d: number) => Process
type TuplePrintProcess = (a: Ptr[], d: number) => Process
type RecordPrintProcess = (a: Record, k: string[], r: string[], d: number) => Process
type GraphPrintProcess = (e: Graph, pr: number, rm: boolean, d: number) => Process

const parens = (x: boolean, c: string) => x ? `(${c})` : c

export const print_inequalities: (m: Inequalities) => string = m => [
  ...Object.keys(m.less).map(k => di(m.less[k] as TypeTree, t => `${k} <= ${print_type(t)}`)),
  ...Object.keys(m.greater).map(k => di(m.greater[k] as TypeTree, t => `${k} >= ${print_type(t)}`))].join(' && ')

export const print_type: PrintType = e => homproc((call, ret) => {
const qq: RecordTypePrintProcess = (a, k, r, d) => () =>
  !k[0] ? ret(`{ ${r.join(', ')} }`) :
  di(k[0], i =>
  call(s(a[i] as TypeTree, 0, d + 1), dx0 =>
  jmp(qq(a, k.slice(1), [...r, `${i}: ${dx0}`], d))))
const q: TupleTypePrintProcess = (a, d) => () =>
  !a[0] ? ret(``) :
  call(s(a[0], 0, d + 1), dx0 =>
  call(q(a.slice(1), d), rest =>
  ret(`, ${dx0}${rest}`)))
const s: TypePrintProcess = (e, p, d) => d === 10 ? () => ret(`...`) : (visit_type({
  [ref]: ({ name }) => ret(name),
  [aka]: ({ name }) => ret(name),
  [ext]: ({ operand }) =>
    call(s(operand, 4, d + 1), dx =>
    ret(parens(p > 3, `Ref ${dx}`))),
  [iov]: ({ operand }) =>
    call(s(operand, 4, d + 1), dx =>
    ret(parens(p > 3, `IO ${dx}`))),
  [num]: () => ret(`Number`),
  [str]: () => ret(`String`),
  [bol]: () => ret(`Boolean`),
  [lit]: ({ value }) => ret(JSON.stringify(value)),
  [unk]: () => ret(`Unknown`),
  [any]: () => ret(`Any`),
  [rec]: ({ elements }) =>
    jmp(qq(elements, Object.keys(elements), [], d)),
  [abs]: ({ vars, lhs, rhs }) =>
    call(s(lhs, 1, d + 1), dx =>
    call(s(rhs, 0, d + 1), dy =>
    ret(parens(p > 0, `${vars.length > 0 ? `\\${vars.map(x => `${x[1] ? '-' : ''}${x[0]}`).join(' ')}.` : ``}${dx} -> ${dy}`)))),
  [cnj]: ({ lhs, rhs }) =>
    call(s(lhs, 2, d + 1), dx =>
    call(s(rhs, 3, d + 1), dy =>
    ret(parens(p > 2, `${dx} & ${dy}`)))),
  [dsj]: ({ lhs, rhs }) =>
    call(s(lhs, 1, d + 1), dx =>
    call(s(rhs, 2, d + 1), dy =>
    ret(parens(p > 1, `${dx} | ${dy}`)))) }))(e)
return s(pretty_vars(e), 0, 0) })

export const print_term: PrintTerm = e => homproc((call, ret) => {
const qq: RecordPrintProcess = (a, k, r, d) => () =>
  !k[0] ? ret(`{ ${r.join(', ')} }`) :
  di(k[0], i =>
  call(s((a[i] as Ptr)[0], 0, true, d + 1), dx0 =>
  jmp(qq(a, k.slice(1), [...r, `${i}: ${dx0}`], d))))
const q: TuplePrintProcess = (a, d) => () =>
  !a[0] ? ret(``) :
  call(s(a[0][0], 0, true, d + 1), dx0 =>
  call(q(a.slice(1), d), rest =>
  ret(`, ${dx0}${rest}`)))
const s: GraphPrintProcess = (e, pr, rm, d) => visit_graph({
  [mod]: ({ body }) => jmp(s(body, pr, rm, d)),
  [app]: ({ lhs, rhs }) => call(s(lhs, 0, false, d + 1), dx => call(s(rhs, 1, pr > 0 || rm, d + 1), dy => ret(parens(pr > 0, `${dx} ${dy}`)))),
  [abs]: ({ parameter, body }) => call(s(body, 0, true, d + 1), dx => ret(parens(!rm, `\\${parameter}.${dx}`))),
  [ref]: ({ name }) => ret(name),
  [sav]: ({ body }) => jmp(s(body, pr, rm, d)),
  [aka]: ({ name }) => ret(name),
  [cst]: ({ destination, body }) => call(s(body, 0, false, d + 1), dx => ret(parens(pr > 0, `${dx} as ${print_type(destination)}`))),
  [acs]: ({ lhs, rhs }) => call(s(lhs, 1, false, d + 1), dx => call(s(rhs, 0, true, d + 1), dy => ret(`${dx}.[${dy}]`))),
  [res]: () => ret(`<record>`),
  [rec]: ({ elements }) => jmp(qq(elements, Object.keys(elements), [], d)),
  [blt]: () => ret(`<native code>`),
  [ext]: () => ret(`<reference>`),
  [iov]: () => ret(`<IO>`),
  [lit]: ({ value }) =>
    ret(Array.isArray(value) ? `[${value.map(_ => "").join(', ')}]` :
    value === undefined ? "undefined" :
    JSON.stringify(value)) })(e)
return s(e, 0, true, 0) })
