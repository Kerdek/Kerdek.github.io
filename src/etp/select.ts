import { Identifier, Proof, Proposition, Statement, walk_proof_conditional, walk_proposition_conditional, walk_statement_conditional } from './abstract.js'
import { TextPosition, TextRange, range_includes, range_includes_inclusive } from './scanner.js'

export type SelectResult =
{ k: 'statement', w: TextRange, n: Statement } |
{ k: 'proof', w: TextRange, n: Statement, e: Proof } |
{ k: 'proposition', w: TextRange, n: Statement, e?: Proof, t: Proposition } |
{ k: 'binding', w: TextRange, i: Identifier, n: Statement, e?: Proof }

export const
select_proposition = (wp: TextPosition, n: Statement, e?: Proof) => walk_proposition_conditional<SelectResult | null>(
t => range_includes(t.w, wp),
t => ({ k: 'proposition', w: t.w, n, ...e ? { e } : e, t }), {
uni: ({ b }) => b,
lam: ({ b }) => b,
app: ({ l, r }) => l || r,
imp: ({ l, r }) => l || r,
ref: () => null,
var: ({ d }) => d,
err: () => null }),

select_proof = (wp: TextPosition, inclusive: boolean, n: Statement) => walk_proof_conditional<SelectResult | null>(
inclusive ? e => range_includes_inclusive(e.w, wp) : e => range_includes(e.w, wp),
e => ({ k: 'proof', w: e.w, n, e }), {
uni: ({ b }) => b,
cdp: ({ b }, e) => {
  if (range_includes(e.wi, wp)) {
    return { k: 'binding', w: e.wi, i: e.i, e: e.b, n } }
  if (e.t) {
    const dt = select_proposition(wp, n, e)(e.t)
    if (dt) {
      return dt } }
  return b },
mop: ({ l, r }) => l || r,
spe: ({ l }, e) => l || select_proposition(wp, n, e)(e.r),
ref: () => null,
lem: ({ d, b }, e) => {
  if (range_includes(e.wi, wp)) {
    return { k: 'binding', w: e.wi, i: e.i, e: e.b, n } }
  return d || b },
def: ({ b }, e) => select_proposition(wp, n, e)(e.d) || b,
prt: ({ b }, e) => select_proposition(wp, n, e)(e.d) || b,
err: () => null }),

select_statement = (wp: TextPosition, inclusive: boolean) => walk_statement_conditional<SelectResult | null>(
inclusive ? n => range_includes_inclusive(n.w, wp) : n => range_includes(n.w, wp),
n => n.k === 'def' && select_proposition(wp, n)(n.d) ||
n.k === 'thm' && (
  select_proposition(wp, n)(n.t) ||
  select_proof(wp, inclusive, n)(n.d)) ||
{ k: 'statement', w: n.w, n })
