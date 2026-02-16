import { Identifier, Proof, Proposition, Statement, walk_proof_conditional, walk_proposition_conditional, walk_statement_conditional } from './abstract.js'
import { TextPosition, TextRange, range_includes, range_includes_inclusive } from './scanner.js'

export type SelectResult =
{ k: 'statement', n: Statement } |
{ k: 'proof', n: Statement, e: Proof } |
{ k: 'proposition', n: Statement, e: Proof, t: Proposition } |
{ k: 'binding', w: TextRange, i: Identifier, e: Proof }

export const

select_proposition = (wp: TextPosition, n: Statement, e: Proof) => walk_proposition_conditional<SelectResult | null>(
t => range_includes(t.w, wp),
t => ({ k: 'proposition', n, e, t }), {
uni: ({ b }) => b,
lam: ({ b }) => b,
app: ({ l, r }) => l || r,
imp: ({ l, r }) => l || r,
ref: () => null,
var: () => null,
err: () => null }),

select_proof = (wp: TextPosition, inclusive: boolean, n: Statement) => walk_proof_conditional<SelectResult | null>(
inclusive ? e => range_includes_inclusive(e.w, wp) : e => range_includes(e.w, wp),
e => ({ k: 'proof', n, e }), {
uni: ({ b }) => b,
cdp: ({ b }, e) => {
  // if (range_includes(e.wi, wp)) {
  //   return { k: 'binding', w: e.wi, i: e.i, e: e.b } }
  if (e.t) {
    const dt = select_proposition(wp, n, e)(e.t)
    if (dt) {
      return dt } }
  return b },
mop: ({ l, r }) => l || r,
spe: ({ l }, e) => l || select_proposition(wp, n, e)(e.r),
ref: () => null,
lem: ({ b }, _e) =>
  // s.reduce<SelectResult | null>((p, [{ d: dp }, { w, i, t, d }]) =>
  //   p ||
  //   t && select_proposition(wp, e)(t) ||
  //   dp ||
  //   range_includes(w, wp) && { k: 'binding', w, i, e: d } ||
  //   null, null) ||
  b,
def: ({ b }, e) => select_proposition(wp, n, e)(e.d) || b,
prt: ({ b }, e) => select_proposition(wp, n, e)(e.d) || b,
err: () => null }),

select_statement = (wp: TextPosition) => walk_statement_conditional<SelectResult | null>(
t => range_includes(t.w, wp),
n => ({ k: 'statement', n }))
