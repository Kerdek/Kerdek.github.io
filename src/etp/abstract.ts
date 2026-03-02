import { Values, Visit, visit } from '../common/util/di.js'
import { Run, run } from '../common/util/run3.js'
import { walk_concrete_article } from './concrete.js'
import { TextRange, fspan } from './scanner.js'

export type Identifier = string

export type Variable = [] | [Proposition]

export type PropositionsT = {
uni: { o?: Proposition, i: Identifier, b: Proposition }
lam: { o?: Proposition, i: Identifier, b: Proposition }
imp: { o?: Proposition, l: Proposition, r: Proposition }
app: { o?: Proposition, l: Proposition, r: Proposition }
ref: { o?: Proposition, i: Identifier }
var: { o?: Proposition, d: Variable }
err: { o?: Proposition } }

export type Propositions =
{ [K in keyof PropositionsT]: { w: TextRange, k: K } & PropositionsT[K] }
export type PropositionKind = keyof Propositions
export type Proposition = Values<Propositions>

export type PropositionResults<T> =
{ [K in PropositionKind]:
  { [F in keyof PropositionsT[K] as
    PropositionsT[K][F] extends Proposition ? F :
    PropositionsT[K][F] extends Variable ? F :
    never] :
    PropositionsT[K][F] extends Variable ? T | null :
    T } }
export type PropositionResult<T> = Values<PropositionResults<T>>

export type PropositionConversion<T> =
{ [K in PropositionKind]:
  (r: PropositionResults<T>[K], e: Propositions[K]) => T }

export type ProofsT = {
uni: { w: TextRange, k: 'uni', i: Identifier, b: Proof }
cdp: { w: TextRange, k: 'cdp', i: Identifier, t?: Proposition, b: Proof }
def: { w: TextRange, k: 'def', i: Identifier, d: Proposition, b: Proof }
lem: { w: TextRange, k: 'lem', i: Identifier, t?: Proposition, d: Proof, b: Proof }
spe: { w: TextRange, k: 'spe', l: Proof, r: Proposition }
mop: { w: TextRange, k: 'mop', l: Proof, r: Proof }
ref: { w: TextRange, k: 'ref', i: Identifier }
prt: { w: TextRange, k: 'prt', d: Proposition, b: Proof }
err: { w: TextRange, k: 'err', b?: Proposition } }

export type Proofs =
{ [K in keyof ProofsT]: { w: TextRange, k: K } & ProofsT[K] }
export type ProofKind = keyof Proofs
export type Proof = Values<Proofs>

export type ProofResults<T> =
{ [K in ProofKind]:
  { [F in keyof ProofsT[K] as
    ProofsT[K][F] extends Proof ? F : never]:
    ProofsT[K][F] extends Proof ? T :
    never }}
export type ProofResult<T> = Values<ProofResults<T>>

export type ProofConversion<T> =
{ [K in ProofKind]: (r: ProofResults<T>[K], e: Proofs[K]) => T }

export type StatementsT = {
imp: { a: Statement | null, i: Identifier }
exf: { a: Statement | null, i: Identifier }
def: { a: Statement | null, i: Identifier, d: Proposition }
prt: { a: Statement | null, d: Proposition }
thm: { a: Statement | null, i: Identifier, t: Proposition, d: Proof } }

export type Statements = {
  [K in keyof StatementsT]: { w: TextRange, k: K } & StatementsT[K] }
export type StatementKind = keyof Statements
export type Statement = Values<Statements>

export type StatementResults<S> =
{ [K in StatementKind]:
  { [F in keyof StatementsT[K] as
    StatementsT[K][F] extends Statement | null ? F : never]:
    StatementsT[K][F] extends Statement | null ? S | null :
    never }}
export type StatementResult<S> = Values<StatementResults<S>>

export type StatementConversion<S> =
{ [K in StatementKind]: (r: StatementResults<S>[K], e: Statements[K]) => S }

export type StatementSelection<S> =
{ [K in StatementKind]: (e: Statements[K]) => S }

export const

abstract_article = walk_concrete_article<Statement | null, Proof, Proposition>({
proposition: {
  par: ({ b }, { lpu, rpu }) => ({ ...b, w: { begin: lpu.w.begin, end: (rpu || b).w.end} }),
  led: ({ b }) => b,
  trl: ({ l }) => l,
  uni: ({ b }, { l, i }) => i ? { k: 'uni', w: fspan(l || i, b), i: i.text, b } : b,
  lam: ({ b }, { l, i }) => i ? { k: 'lam', w: fspan(l || i, b), i: i.text, b } : b,
  dot: ({ b }, { }) => b,
  ref: ({ }, { i }) => ({ k: 'ref', w: i.w, i: i.text }),
  imp: ({ l, r }, { }) => ({ k: 'imp', w: fspan(l, r), l, r }),
  app: ({ l, r }, { }) => ({ k: 'app', w: fspan(l, r), l, r }),
  err: ({ }, { w }) => ({ k: 'err', w }) },
proof: {
  par: ({ b }, { lbu, rbu }) => ({ ...b, w: { begin: lbu.w.begin, end: (rbu || b).w.end} }),
  led: ({ b }, { }) => b,
  trl: ({ l }, { }) => l,
  prt: ({ d, b }, { l }) => ({ k: 'prt', w: fspan(l, b), d, b }),
  lam: ({ b }, { }) => b,
  uni: ({ b }, { l, i }) => !i ? b : ({ k: 'uni', w: fspan(l || i, b), i: i.text, b }),
  dot: ({ b }, { }) => b,
  cdp: ({ b }, { l, i }) => !i ? b : { k: 'cdp', w: fspan(l || i, b), i: i.text, b },
  cdt: ({ t, b }, { l, i }) => !i ? b : { k: 'cdp', w: fspan(l || i, b), i: i.text, t, b },
  def: ({ d, b }, { l, i }) => !i ? b : { k: 'def', w: fspan(l, b), i: i ? i.text : '', d, b, },
  lem: ({ d, b }, { l, i }) => !i ? b : { k: 'lem', w: fspan(l, b), i: i.text, d, b },
  let: ({ t, d, b }, { l, i }) => !i ? b : { k: 'lem', w: fspan(l, b), i: i.text, t, d, b },
  spe: ({ l, r }, { }) => ({ k: 'spe', w: fspan(l, r), l, r }),
  mop: ({ l, r }, { }) => ({ k: 'mop', w: fspan(l, r), l, r }),
  ref: ({ }, { i }) => ({ k: 'ref', w: i.w, i: i.text }),
  err: ({ }, { w }) => ({ k: 'err', w }) },
statement: {
  trl: ({ a }, { }) => a,
  imp: ({ a }, { l, i }) => !i ? a : { a, k: 'imp', w: fspan(l, i), i: JSON.parse(i.text) },
  exf: ({ a }, { l, i }) => !i ? a : { a, k: 'exf', w: fspan(l, i), i: i.text },
  def: ({ a, d }, { l, i }) => !i ? a : { a, k: 'def', w: fspan(l, d), i: i.text, d },
  prt: ({ a, d }, { l }) => ({ a, k: 'prt', w: fspan(l, d), d }),
  thm: ({ a, t, d }, { l, i }) => !i ? a : { a, k: 'thm', w: fspan(l, d), i: i.text, t, d } } }),

visit_proposition: Visit<Propositions> = visit,
visit_proof: Visit<Proofs> = visit,
visit_statement: Visit<Statements> = visit,

walk_proposition = <U>(p: PropositionConversion<U>) =>
run(<P, R>({ proc, call, ret }: Run<U, P, R>) => {
const main: (e: Proposition) => P = proc(visit_proposition({
  uni: e => call(main(e.b), b => ret(p.uni({ b }, e))),
  lam: e => call(main(e.b), b => ret(p.lam({ b }, e))),
  imp: e => call(main(e.l), l => call(main(e.r), r => ret(p.imp({ l, r }, e)))),
  app: e => call(main(e.l), l => call(main(e.r), r => ret(p.app({ l, r }, e)))),
  ref: e => ret(p.ref({ }, e)),
  var: e => e.d[0] ? call(main(e.d[0]), d => ret(p.var({ d }, e))) : ret(p.var({ d: null }, e)),
  err: e => ret(p.err({ }, e)) }))
return main }),

walk_proposition_conditional = <U>(
  c: (t: Proposition) => boolean,
  f: (t: Proposition) => U | null,
  p: PropositionConversion<U | null>) =>
run(<P, R>({ proc, call, ret }: Run<U | null, P, R>) => {
const inner: (e: Proposition) => P = proc(visit_proposition({
  uni: e => call(main(e.b), b => ret(p.uni({ b }, e))),
  lam: e => call(main(e.b), b => ret(p.lam({ b }, e))),
  imp: e => call(main(e.l), l => call(main(e.r), r => ret(p.imp({ l, r }, e)))),
  app: e => call(main(e.l), l => call(main(e.r), r => ret(p.app({ l, r }, e)))),
  ref: e => ret(p.ref({ }, e)),
  var: e => e.d[0] ? call(main(e.d[0]), d => ret(p.var({ d }, e))) : ret(p.var({ d: null }, e)),
  err: e => ret(p.err({ }, e)) })),
main = proc((e: Proposition) => c(e) ? call(inner(e), u => ret(u || f(e))) : ret(null))
return main }),

walk_proof = <T>(o: ProofConversion<T>) =>
run(<P, R>({ proc, call, ret }: Run<T, P, R>) => {
const main: (e: Proof) => P = proc(visit_proof({
  uni: e => call(main(e.b), b => ret(o.uni({ b }, e))),
  spe: e => call(main(e.l), l => ret(o.spe({ l }, e))),
  mop: e => call(main(e.l), l => call(main(e.r), r => ret(o.mop({ l, r }, e)))),
  ref: e => ret(o.ref({ }, e)),
  cdp: e => call(main(e.b), b => ret(o.cdp({ b }, e))),
  def: e => call(main(e.b), b => ret(o.def({ b }, e))),
  lem: e => call(main(e.d), d => call(main(e.b), b => ret(o.lem({ d, b }, e)))),
  prt: e => call(main(e.b), b => ret(o.prt({ b }, e))),
  err: e => ret(o.err({ }, e)) }))
return main }),

walk_proof_conditional = <T>(
  c: (t: Proof) => boolean,
  f: (t: Proof) => T | null,
  o: ProofConversion<T | null>) =>
run(<P, R>({ proc, call, ret }: Run<T | null, P, R>) => {
const inner: (e: Proof) => P = proc(visit_proof({
  uni: e => call(main(e.b), b => ret(o.uni({ b }, e))),
  spe: e => call(main(e.l), l => ret(o.spe({ l }, e))),
  mop: e => call(main(e.l), l => call(main(e.r), r => ret(o.mop({ l, r }, e)))),
  ref: e => ret(o.ref({ }, e)),
  cdp: e => call(main(e.b), b => ret(o.cdp({ b }, e))),
  def: e => call(main(e.b), b => ret(o.def({ b }, e))),
  lem: e => call(main(e.d), d => call(main(e.b), b => ret(o.lem({ d, b }, e)))),
  prt: e => call(main(e.b), b => ret(o.prt({ b }, e))),
  err: e => ret(o.err({ }, e)) })),
main = proc((e: Proof) => c(e) ? call(inner(e), u => ret(u || f(e))) : ret(null))
return main }),

walk_statement = <S>(n: StatementConversion<S>) =>
run(<P, R>({ proc, call, cc, ret }: Run<S | null, P, R>) => {
const pre = proc((a: Statement | null) =>
  a ? cc(main(a)) : ret(null))
const main: (e: Statement) => P = proc(visit_statement({
  imp: e => call(pre(e.a), a => ret(n.imp({ a }, e))),
  exf: e => call(pre(e.a), a => ret(n.exf({ a }, e))),
  def: e => call(pre(e.a), a => ret(n.def({ a }, e))),
  thm: e => call(pre(e.a), a => ret(n.thm({ a }, e))),
  prt: e => call(pre(e.a), a => ret(n.prt({ a }, e))) }))
return main }),

walk_statement_conditional = <S>(
  c: (t: Statement) => boolean,
  n: (t: Statement) => S) =>
run(<P, R>({ proc, cc, ret }: Run<S | null, P, R>) => {
const pre = proc((a: Statement | null) =>
  a ? cc(main(a)) : ret(null))
const main: (e: Statement) => P = proc(visit_statement({
  imp: e => c(e) ? ret(n(e)) : cc(pre(e.a)),
  exf: e => c(e) ? ret(n(e)) : cc(pre(e.a)),
  def: e => c(e) ? ret(n(e)) : cc(pre(e.a)),
  thm: e => c(e) ? ret(n(e)) : cc(pre(e.a)),
  prt: e => c(e) ? ret(n(e)) : cc(pre(e.a)) }))
return main })
