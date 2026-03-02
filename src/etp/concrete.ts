import { Values, Visit, di, visit } from '../common/util/di.js'
import { Messages } from './context.js'
import { Run, run } from './run.js'
import { TextRange } from './scanner.js'
import { Token, Tokens } from './tokenizer.js'

export type ConcretePropositionsT = {
par: { lpu: Token, b: ConcreteProposition, rpu?: Token }
led: { wab: Tokens, b: ConcreteProposition }
trl: { l: ConcreteProposition, wlr: Tokens }
uni: { l?: Token, wli: Tokens, i?: Token, b: ConcreteProposition }
lam: { l?: Token, wli: Tokens, i?: Token, b: ConcreteProposition }
dot: { l?: Token, wli: Tokens, dtu: Token, b: ConcreteProposition }
ref: { i: Token }
imp: { l: ConcreteProposition, aru: Token, r: ConcreteProposition }
app: { l: ConcreteProposition, wlr: Tokens, r: ConcreteProposition }
err: { w: TextRange } }

export type ConcretePropositions =
{ [K in keyof ConcretePropositionsT]: { k: K, m: Messages } & ConcretePropositionsT[K] }
export type ConcretePropositionKind = keyof ConcretePropositions
export type ConcreteProposition = Values<ConcretePropositions>

export type ConcretePropositionResults<T> =
{ [K in ConcretePropositionKind]:
  { [F in keyof ConcretePropositionsT[K] as ConcretePropositionsT[K][F] extends
    ConcreteProposition ? F : never]:
    T } }
export type ConcretePropositionResult<T> = Values<ConcretePropositionResults<T>>

export type ConcretePropositionConversion<T> =
{ [K in ConcretePropositionKind]: (r: ConcretePropositionResults<T>[K], e: ConcretePropositions[K]) => T }

export type ConcreteProofsT = {
par: { lbu: Token, b: ConcreteProof, rbu?: Token }
led: { wab: Tokens, b: ConcreteProof }
trl: { l: ConcreteProof, wlr: Tokens }
prt: { l: Token, d: ConcreteProposition, dtu?: Token, b: ConcreteProof }
lam: { l: Token, wldt: Tokens, dtu?: Token, b: ConcreteProof }
uni: { l?: Token, wli: Tokens, i?: Token, b: ConcreteProof }
dot: { l?: Token, wldt: Tokens, dtu: Token, b: ConcreteProof }
cdp: { l?: Token, wli: Tokens, i: Token, b: ConcreteProof }
cdt: { l?: Token, wllb: Tokens, lbu?: Token, wlbi: Tokens, i?: Token, wicn: Tokens, cnu?: Token, t: ConcreteProposition, rbu?: Token, b: ConcreteProof }
def: { l: Token, wli: Tokens, i?: Token, wice: Tokens, ceu?: Token, d: ConcreteProposition, dtu?: Token, b: ConcreteProof }
lem: { l: Token, wli: Tokens, i?: Token, wicn: Tokens, ceu?: Token, d: ConcreteProof, dtu?: Token, b: ConcreteProof }
let: { l: Token, wli: Tokens, i?: Token, wicn: Tokens, cnu: Token, t: ConcreteProposition, ceu?: Token, d: ConcreteProof, dtu?: Token, b: ConcreteProof }
spe: { l: ConcreteProof, wlr: Tokens, r: ConcreteProposition }
mop: { l: ConcreteProof, wlr: Tokens, r: ConcreteProof }
ref: { i: Token }
err: { w: TextRange, b: ConcreteProposition } }

export type ConcreteProofs =
{ [K in keyof ConcreteProofsT]: { k: K, m: Messages } & ConcreteProofsT[K] }
export type ConcreteProofKind = keyof ConcreteProofs
export type ConcreteProof = Values<ConcreteProofs>

export type ConcreteProofResults<T, U> =
{ [K in ConcreteProofKind]:
  { [F in keyof ConcreteProofsT[K] as
    ConcreteProofsT[K][F] extends ConcreteProof | ConcreteProposition ? F : never]:
    ConcreteProofsT[K][F] extends ConcreteProof ? T :
    ConcreteProofsT[K][F] extends ConcreteProposition ? U :
    never }}
export type ConcreteProofResult<T, U> = Values<ConcreteProofResults<T, U>>

export type ConcreteProofConversion<T, U> =
{ [K in ConcreteProofKind]: (r: ConcreteProofResults<T, U>[K], e: ConcreteProofs[K]) => T }

export type ConcreteStatementsT = {
trl: { a: ConcreteStatement | null, wal: Tokens }
imp: { a: ConcreteStatement | null, wal: Tokens, l: Token, wli: Tokens, i?: Token, widt: Tokens, dtu?: Token }
exf: { a: ConcreteStatement | null, wal: Tokens, l: Token, wli: Tokens, i: Token | null, widt: Tokens, dtu?: Token }
def: { a: ConcreteStatement | null, wal: Tokens, l: Token, wli: Tokens, i?: Token, wice: Tokens, ceu?: Token, d: ConcreteProposition, dtu?: Token }
prt: { a: ConcreteStatement | null, wal: Tokens, l: Token, wld: Tokens, d: ConcreteProposition, dtu?: Token }
thm: { a: ConcreteStatement | null, wal: Tokens, l: Token, wli: Tokens, i: Token | null, wicn: Tokens, cnu?: Token, t: ConcreteProposition, ceu?: Token, d: ConcreteProof, dtu?: Token } }

export type ConcreteStatements = {
  [K in keyof ConcreteStatementsT]: { k: K, m: Messages } & ConcreteStatementsT[K] }
export type ConcreteStatementKind = keyof ConcreteStatements
export type ConcreteStatement = Values<ConcreteStatements>

export type ConcreteStatementResults<S, T, U> =
{ [K in ConcreteStatementKind]:
  { [F in keyof ConcreteStatementsT[K] as
    ConcreteStatementsT[K][F] extends ConcreteStatement | null | ConcreteProof | ConcreteProposition ? F : never]:
    ConcreteStatementsT[K][F] extends ConcreteStatement | null ? S | null :
    ConcreteStatementsT[K][F] extends ConcreteProof ? T :
    ConcreteStatementsT[K][F] extends ConcreteProposition ? U :
    never }}
export type ConcreteStatementResult<S, T, U> = Values<ConcreteStatementResults<S, T, U>>

export type ConcreteStatementConversion<S, T, U> =
{ [K in ConcreteStatementKind]: (r: ConcreteStatementResults<S, T, U>[K], e: ConcreteStatements[K]) => S }

export type ConcreteArticleConversion<S, T, U> = {
proposition: ConcretePropositionConversion<U>,
proof: ConcreteProofConversion<T, U>,
statement: ConcreteStatementConversion<S, T, U> }

export const

visit_concrete_proposition : Visit<ConcretePropositions> = visit,
visit_concrete_proof : Visit<ConcreteProofs> = visit,
visit_concrete_statement : Visit<ConcreteStatements> = visit,

walk_concrete_article = <S, T, U>(c: ConcreteArticleConversion<S, T, U>) => {
const
{ proposition: p, proof: o, statement: n } = c,
typ = run(<P, R>({ proc, call, ret }: Run<U, P, R>) => {
  const main: (e: ConcreteProposition) => P = proc(visit_concrete_proposition({
    par: e => call(main(e.b), b => ret(p.par({ b }, e))),
    led: e => call(main(e.b), b => ret(p.led({ b }, e))),
    trl: e => call(main(e.l), l => ret(p.trl({ l }, e))),
    uni: e => call(main(e.b), b => ret(p.uni({ b }, e))),
    lam: e => call(main(e.b), b => ret(p.lam({ b }, e))),
    dot: e => call(main(e.b), b => ret(p.dot({ b }, e))),
    imp: e => call(main(e.l), l => call(main(e.r), r => ret(p.imp({ l, r }, e)))),
    app: e => call(main(e.l), l => call(main(e.r), r => ret(p.app({ l, r }, e)))),
    ref: e => ret(p.ref({ }, e)),
    err: e => ret(p.err({ }, e)) }))
  return main }),
trm = run(<P, R>({ proc, call, ret }: Run<T, P, R>) => {
  const main: (e: ConcreteProof) => P = proc(visit_concrete_proof({
    par: e => call(main(e.b), b => ret(o.par({ b }, e))),
    led: e => call(main(e.b), b => ret(o.led({ b }, e))),
    trl: e => call(main(e.l), l => ret(o.trl({ l }, e))),
    uni: e => call(main(e.b), b => ret(o.uni({ b }, e))),
    lam: e => call(main(e.b), b => ret(o.lam({ b }, e))),
    dot: e => call(main(e.b), b => ret(o.dot({ b }, e))),
    spe: e => call(main(e.l), l => di(typ(e.r), rp => ret(o.spe({ l, r: rp }, e)))),
    mop: e => call(main(e.l), l => call(main(e.r), r => ret(o.mop({ l, r }, e)))),
    ref: e => ret(o.ref({ }, e)),
    cdp: e => call(main(e.b), b => ret(o.cdp({ b }, e))),
    cdt: e => di(typ(e.t), t => call(main(e.b), b => ret(o.cdt({ b, t }, e)))),
    def: e => di(typ(e.d), d => call(main(e.b), b => ret(o.def({ d, b }, e)))),
    lem: e => call(main(e.d), d => call(main(e.b), b => ret(o.lem({ d, b }, e)))),
    let: e => di(typ(e.t), t => call(main(e.d), d => call(main(e.b), b => ret(o.let({ t, d, b }, e))))),
    prt: e => di(typ(e.d), d => call(main(e.b), b => ret(o.prt({ d, b }, e)))),
    err: e => di(typ(e.b), b => ret(o.err({ b }, e))) }))
  return main }),
stmt = run(<P, R>({ proc, call, cc, ret }: Run<S | null, P, R>) => {
  const pre = proc((a: ConcreteStatement | null) =>
    a ? cc(main(a)) : ret(null))
  const main: (e: ConcreteStatement) => P = proc(visit_concrete_statement({
    imp: e => call(pre(e.a), a => ret(n.imp({ a }, e))),
    exf: e => call(pre(e.a), a => ret(n.exf({ a }, e))),
    def: e => call(pre(e.a), a => di(typ(e.d), d => ret(n.def({ a, d }, e)))),
    thm: e => call(pre(e.a), a => di(typ(e.t), t => di(trm(e.d), d => ret(n.thm({ a, t, d }, e))))),
    prt: e => call(pre(e.a), a => di(typ(e.d), d => ret(n.prt({ a, d }, e)))),
    trl: e => call(pre(e.a), a => ret(n.trl({ a }, e))) }))
  return main })
return stmt }
