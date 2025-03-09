import { Inequalities } from "./constraints.js";
import { di } from "./di.js"
import { abs, any, cnj, dsj, ref, TypeTree, unk, visit_type, lit, num, str, bol, iov, rec, TypeMap, aka, ext } from "./graph.js"
import { homproc, jmp, Process } from "./run.js"

export const inequality_vars: (m: Inequalities, b: boolean) => [string, boolean][] = (m, b) => [
...map_vars(m.less, b),
...map_vars(m.greater, !b)]

export const map_vars: (m: TypeMap, b: boolean) => [string, boolean][] = (m, b) =>
Object.keys(m).map(k => type_vars(m[k] as TypeTree, b)).flat(1)

export const subtract_vars: (l: [string, boolean][], r: [string, boolean][]) => [string, boolean][] = (l, r) => {
const o: [string, boolean][] = []
for (const ll of l) {
  if (r.some(rr => ll[0] === rr[0] && ll[1] === rr[1])) {
    continue }
  o.push(ll) }
return o }

export const type_vars: (t: TypeTree, b: boolean) => [string, boolean][] = (t, b) => homproc((call, ret) => {
const q: (t: TypeMap, k: string[], b: boolean) => Process = (t, k, b) => () =>
!k[0] ? ret([]) :
di(k[0], i =>
call(s(t[i] as TypeTree, b), dx =>
call(q(t, k.slice(1), b), dr =>
ret([...dx, ...dr]))))
const s: (t: TypeTree, b: boolean) => Process = (t, b) => visit_type({
  [unk]: () => ret([]),
  [any]: () => ret([]),
  [aka]: () => ret([]),
  [lit]: () => ret([]),
  [num]: () => ret([]),
  [str]: () => ret([]),
  [bol]: () => ret([]),
  [ref]: e => ret([[e.name, b]]),
  [ext]: e => jmp(s(e.operand, b)),
  [iov]: e => jmp(s(e.operand, b)),
  [rec]: e => jmp(q(e.elements, Object.keys(e.elements), b)),
  [abs]: e =>
    call(s(e.lhs, !b), dx =>
    call(s(e.rhs, b), dy =>
    ret(subtract_vars([...dx, ...dy], e.vars)))),
  [cnj]: e =>
    call(s(e.lhs, b), dx =>
    call(s(e.rhs, b), dy =>
    ret([...new Set([...dx, ...dy])]))),
  [dsj]: e =>
    call(s(e.lhs, b), dx =>
    call(s(e.rhs, b), dy =>
    ret([...new Set([...dx, ...dy])]))) })(t)
return s(t, b) })