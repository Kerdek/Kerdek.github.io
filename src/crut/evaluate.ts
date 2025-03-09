import { assign } from './assign.js'
import { builtins } from './builtins.js'
import { Mod, Normal, Sav, Record, term_sav, App, visit_graph, Aka, Ref, Acs, term_lit, term_aka, Abs, Blt, Iov, Lit, Graph, Term, term_mod, term_app, term_abs, term_acs, term_rec, Rec, RecordSyntax, Ptr, abs, acs, app, blt, iov, lit, mod, rec, sav, aka, ref, term_res, Res, res, cst, Cst, ext, Ext } from './graph.js'
import { di } from './di.js'
import { Branch, homproc, jmp, Process } from './run.js'
import { print_term } from './print.js'

type Evaluate = (e: Graph) => Normal

type Bubble = (e: Sav) => Term

type EvaluateProcess = (
call: (u: Process, v: (x: Normal) => Branch) => Branch,
ret: (x: Normal) => Branch) => Process

type BubbleProcess = (
call: (u: Process, v: (x: Term) => Branch) => Branch,
ret: (x: Term) => Branch) => Process

const bubble_sav: (e: Sav, y: Sav) => BubbleProcess = (e, y) => (call, ret) => () =>
call(bubble_root(y)(call, ret), () =>
jmp(bubble_root(e)(call, ret)))

const bubble_mod: (e: Sav, y: Mod) => BubbleProcess = (e, y) => (_call, ret) => () => {
const o = { ...e.record }
for (const def of y.module) {
  delete o[def[0]] }
return ret(term_mod(y.module.map(d => [d[0], term_sav(o, d[1]), d[2], d[3]]), term_sav(o, y.body))) }

const bubble_app: (e: Sav, y: App) => BubbleProcess = (e, y) => (_call, ret) => () =>
ret(term_app(y.location, term_sav(e.record, y.lhs), term_sav(e.record, y.rhs)))

const bubble_abs: (e: Sav, y: Abs) => BubbleProcess = (e, y) => (_call, ret) => () =>
di({ ...e.record }, o => (
delete o[y.parameter],
ret(term_abs(y.location, y.parameter, term_sav(o, y.body)))))

const bubble_var: (e: Sav, y: Ref) => BubbleProcess = (e, y) => (_call, ret) => () =>
di(e.record[y.name], u =>
ret(u === undefined ? y : term_aka(u, y.name)))

const bubble_cst: (e: Sav, y: Cst) => BubbleProcess = (e, y) => (call, ret) => () =>
jmp(bubble_root(term_sav(e.record, y.body))(call, ret))

const bubble_res: (e: Sav, y: Res) => BubbleProcess = (e, y) => (_call, ret) => () =>
ret(term_res(y.elements.map(a => a[0] ?
[true, term_sav(e.record, a[1])] :
[false, a[1], term_sav(e.record, a[2])])))

const bubble_acs: (e: Sav, y: Acs) => BubbleProcess = (e, y) => (_call, ret) => () =>
ret(term_acs(y.location, term_sav(e.record, y.lhs), term_sav(e.record, y.rhs)))

const bubble_rec: (e: Sav, y: Rec) => BubbleProcess = (_e, y) => (_call, ret) => () => ret(y)
const bubble_shr: (e: Sav, y: Aka) => BubbleProcess = (_e, y) => (_call, ret) => () => ret(y)
const bubble_lit: (e: Sav, y: Lit) => BubbleProcess = (_e, y) => (_call, ret) => () => ret(y)
const bubble_ext: (e: Sav, y: Ext) => BubbleProcess = (_e, y) => (_call, ret) => () => ret(y)
const bubble_iov: (e: Sav, y: Iov) => BubbleProcess = (_e, y) => (_call, ret) => () => ret(y)
const bubble_blt: (e: Sav, y: Blt) => BubbleProcess = (_e, y) => (_call, ret) => () => ret(y)

const bubble_switch: (e: Sav) => BubbleProcess = e => (call, ret) => visit_graph({
[sav]: y => jmp(bubble_sav(e, y)(call, ret)),
[mod]: y => jmp(bubble_mod(e, y)(call, ret)),
[app]: y => jmp(bubble_app(e, y)(call, ret)),
[abs]: y => jmp(bubble_abs(e, y)(call, ret)),
[cst]: y => jmp(bubble_cst(e, y)(call, ret)),
[ref]: y => jmp(bubble_var(e, y)(call, ret)),
[res]: y => jmp(bubble_res(e, y)(call, ret)),
[rec]: y => jmp(bubble_rec(e, y)(call, ret)),
[acs]: y => jmp(bubble_acs(e, y)(call, ret)),
[aka]: y => jmp(bubble_shr(e, y)(call, ret)),
[lit]: y => jmp(bubble_lit(e, y)(call, ret)),
[ext]: y => jmp(bubble_ext(e, y)(call, ret)),
[iov]: y => jmp(bubble_iov(e, y)(call, ret)),
[blt]: y => jmp(bubble_blt(e, y)(call, ret)) })(e.body)

const bubble_root: (e: Sav) => BubbleProcess = e => (call, ret) => () =>
call(bubble_switch(e)(call, ret), de =>
ret(assign(e, de)))

export const bubble: Bubble = e => homproc(bubble_root(e))

const evaluate_sav: (e: Sav) => EvaluateProcess = e => (call, ret) => () =>
jmp(evaluate_root(bubble(e))(call, ret))

const evaluate_mod: (e: Mod) => EvaluateProcess = e => (call, ret) => () => {
const op: Record = {}
for (const def of e.module) {
  op[def[0]] = [term_sav(op, def[1])] }
return jmp(evaluate_root(term_sav(op, e.body))(call, ret)) }

const evaluate_app: (e: App) => EvaluateProcess = e => (call, ret) => () =>
call(evaluate_root(e.lhs)(call, ret), dx => jmp(visit_graph({
[abs]: x => jmp(evaluate_root(term_sav({ [x.parameter]: [e.rhs] }, x.body))(call, ret)),
[blt]: x => jmp(x.code(e.rhs)(call, ret)),
[ext]: x => { throw new Error(`runtime: Expected a function instead of \`${print_term(x)}\`.`) },
[iov]: x => { throw new Error(`runtime: Expected a function instead of \`${print_term(x)}\`.`) },
[rec]: x => { throw new Error(`runtime: Expected a function instead of \`${print_term(x)}\`.`) },
[lit]: x => { throw new Error(`runtime: Expected a function instead of \`${print_term(x)}\`.`) } })(dx)))

const evaluate_shr: (e: Aka) => EvaluateProcess = e => (call, ret) => () =>
call(evaluate_root(e.identity[0])(call, ret), dx =>
(e.identity[0] = dx,
ret(dx)))

const evaluate_war: (e: Ref) => EvaluateProcess = ({ location: w, name }) => (_call, ret) => () =>
di(builtins[name], r =>
!r ? (() => { throw new Error(`(${w[0]}:${w[1]}:${w[2]}): runtime: Undefined reference to \`${name}\`.`)})() :
ret(r))

const evaluate_cst: (e: Cst) => EvaluateProcess = e => (call, ret) => () =>
jmp(evaluate_root(e.body)(call, ret))

const evaluate_acs: (e: Acs) => EvaluateProcess = ({ lhs, rhs }) => (call, ret) => () =>
call(evaluate_root(lhs)(call, ret), dx =>
call(evaluate_root(rhs)(call, ret), dy =>
di(((dx as Rec).elements as any)[(dy as Lit).value as any], j =>
typeof (dx as Lit).value === "string" ? ret(term_lit(j[0])) :
jmp(evaluate_root(term_aka(j, "<object access>"))(call, ret)))))

const evaluate_res: (e: Res) => EvaluateProcess = ({ elements }) => (call, ret) => () =>
jmp(evaluate_record_syntax(elements, {})(call, ret))

const evaluate_record_syntax: (a: RecordSyntax, o: Record) => EvaluateProcess = (a, o) => (call, ret) => () =>
di(a[0], e =>
e === undefined ? ret(term_rec(o)) :
e[0] ?
  call(evaluate_root(e[1])(call, ret), de =>
  de.kind !== rec ? (() => { throw new Error("runtime: Expected a string.") })() :
  jmp(evaluate_record_syntax(a.slice(1), { ...o, ...de.elements })(call, ret))):
jmp(evaluate_record_syntax(a.slice(1), { ...o, [e[1]]: [e[2]] as Ptr })(call, ret)))

const evaluate_rec: (e: Rec) => EvaluateProcess = e => (_call, ret) => () => ret(e)
const evaluate_abs: (e: Abs) => EvaluateProcess = e => (_call, ret) => () => ret(e)
const evaluate_blt: (e: Blt) => EvaluateProcess = e => (_call, ret) => () => ret(e)
const evaluate_ext: (e: Ext) => EvaluateProcess = e => (_call, ret) => () => ret(e)
const evaluate_iov: (e: Iov) => EvaluateProcess = e => (_call, ret) => () => ret(e)
const evaluate_lit: (e: Lit) => EvaluateProcess = e => (_call, ret) => () => ret(e)

export const evaluate_root: (e: Graph) => EvaluateProcess = e => (call, ret) => visit_graph({
[sav]: e => jmp(evaluate_sav(e)(call, ret)),
[mod]: e => jmp(evaluate_mod(e)(call, ret)),
[app]: e => jmp(evaluate_app(e)(call, ret)),
[aka]: e => jmp(evaluate_shr(e)(call, ret)),
[ref]: e => jmp(evaluate_war(e)(call, ret)),
[cst]: e => jmp(evaluate_cst(e)(call, ret)),
[acs]: e => jmp(evaluate_acs(e)(call, ret)),
[res]: e => jmp(evaluate_res(e)(call, ret)),
[rec]: e => jmp(evaluate_rec(e)(call, ret)),
[abs]: e => jmp(evaluate_abs(e)(call, ret)),
[blt]: e => jmp(evaluate_blt(e)(call, ret)),
[ext]: e => jmp(evaluate_ext(e)(call, ret)),
[iov]: e => jmp(evaluate_iov(e)(call, ret)),
[lit]: e => jmp(evaluate_lit(e)(call, ret)) })(e)

export const evaluate: Evaluate = e => homproc(evaluate_root(e))