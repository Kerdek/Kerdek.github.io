import { Run, run } from './run.js'
import { di, uniques } from '../common/util/di.js'
import {
  Sigma,
  Rho,
  Pi,
  Context,
  Goal,
  Messages,
  msg,
  Judgment,
  Module} from './context.js'
import {
  Identifier,
  Proof,
  Proposition,
  Propositions,
  Statement,
  Variable,
  visit_proof,
  visit_proposition,
  visit_statement } from './abstract.js'

export type Finding = { found?: Proposition } & Goal
export type Transcript = [Proof, Finding][]
export type Findings = [Transcript, Messages]

const

cascade = <T, U>(f: (ctx: U) => T, a: U, b: U) =>
f(a) || f(b),

proposition_bound0 = (i: Identifier, pfx: Pi) =>
pfx.includes(i),

proposition_bound = (i: Identifier, ctx: Pi, pfx: Pi) =>
cascade(pi => pi.includes(i), ctx, pfx),

proof_bound0 = (i: Identifier, pfx: Sigma) =>
pfx.some(({ i: ip }) => ip === i),

proof_bound = (i: Identifier, ctx: Sigma, pfx: Sigma) =>
cascade(ctx => ctx.some(({ i: ip }) => ip === i), ctx, pfx),

look_up_proposition = (i: Identifier, ctx: Rho) =>
ctx.findLast(({ i: ip }) => ip === i),

look_up_proof = (i: Identifier, ctx: Sigma, pfx: Sigma) =>
cascade(ctx => ctx.findLast(({ i: ip }) => ip === i), ctx, pfx),

undefine = (i: Identifier, rho: Rho) =>
rho.filter(({ i: ip }) => ip !== i),

safe = (i: Identifier, bound: Pi): Identifier => {
while (bound.some(ipp => ipp === i)) {
  i = `${i}'` }
return i },

reference_occurs_free = run(<P, R>({ proc, call, cc, ret }: Run<boolean, P, R>) => {
const save = (iota: Identifier) => {
const
quantifier = ({ i, b }: Propositions['uni' | 'lam']) =>
  i === iota ? ret(false) : cc(main(b)),
binary = ({ l, r }: Propositions['imp' | 'app']) =>
  call(main(l), dl => dl ? ret(true) : cc(main(r))),
main: (tau: Proposition) => P = proc(visit_proposition({
uni: quantifier, lam: quantifier,
imp: binary, app: binary,
ref: ({ i }) => ret(i === iota),
var: ({ }) => ret(false),
err: ({ }) => ret(false) }))
return main }
return (tau, iota) => save(iota)(tau) }),

variable_occurs = run(<P, R>({ proc, call, cc, ret }: Run<boolean, P, R>) => {
const save = (v: Variable) => {
const
quantifier = ({ b }: Propositions['uni' | 'lam']) =>
  cc(main(b)),
binary = ({ l, r }: Propositions['imp' | 'app']) =>
  call(main(l), dl => dl ? ret(true) : cc(main(r))),
def = () => ret(false),
main: (tau: Proposition) => P = proc(visit_proposition({
uni: quantifier, lam: quantifier,
imp: binary, app: binary,
ref: def, err: def,
var: ({ d }) => ret(d === v) }))
return main }
return (tau: Proposition, iota: Variable) => save(iota)(tau) }),

free_references = run(<P, R>({ proc, call, cc, ret }: Run<Pi, P, R>) => {
const save = (pi: Pi) => {
const
quantifier = ({ i, b }: Propositions['uni' | 'lam']) =>
  cc(save([...pi, i])(b)),
binary = ({ l, r }: Propositions['imp' | 'app']) =>
call(main(l), l => call(main(r), r => ret([...l, ...r]))),
def = () => ret([]),
main: (tau: Proposition) => P = proc(visit_proposition({
uni: quantifier, lam: quantifier,
imp: binary, app: binary,
var: def, err: def,
ref: ({ i }) => ret(pi.includes(i) ? [] : [i]) }))
return main }
return (tau: Proposition) => save([])(tau) }),

closed = run(<P, R>({ proc, call, cc, ret }: Run<boolean, P, R>) => {
const save = (ctx: Pi) => {
const
quantifier = ({ i, b }: Propositions['uni' | 'lam']) =>
  cc(save([...ctx, i])(b)),
binary = ({ l, r }: Propositions['imp' | 'app']) =>
  call(main(l), dx => !dx ? ret(false) : cc(main(r))),
def = () => ret(true),
main: (tau: Proposition) => P = proc(visit_proposition({
uni: quantifier, lam: quantifier,
imp: binary, app: binary,
var: def, err: def,
ref: ({ i }) => ret(proposition_bound0(i, ctx)) }))
return main }
return (tau: Proposition, ctx: Pi) => save(ctx)(tau) }),

rename = run(<P, R>({ proc, call, ret }: Run<Proposition, P, R>) => {
const save = (iq: Identifier, ip: Identifier) => {
const
quantifier = ({ i, b, ...z }: Propositions['uni' | 'lam']) =>
  i === iq ? ret({ i, b, ...z }) :
  i !== ip ?
    call(main(b), b =>
    ret({ i, b, ...z })) :
  di(safe(i, uniques([...free_references({ i, b, ...z }), ip])), ip =>
  call(save(i, ip)(b), b =>
  call(main(b), b =>
  ret({ i: ip, b, ...z })))),
binary = ({ l, r, ...z }: Propositions['imp' | 'app']) =>
  call(main(l), l =>
  call(main(r), r =>
  ret({ l, r, ...z }))),
main: (t: Proposition) => P = proc(visit_proposition({
ref: ({ i, ...z }) =>
  ret({ i: i === iq ? ip : i, ...z }),
uni: quantifier, lam: quantifier,
imp: binary, app: binary,
var: ret, err: ret }))
return main }
return (t: Proposition, iq: Identifier, ip: Identifier) => save(iq, ip)(t) }),

substitute = run(<P, R>({ proc, call, cc, ret }: Run<Proposition, P, R>) => {
const save = (iota: Identifier | Variable, tau: Proposition) => {
const
quantifier = ({ i, b, ...z }: Propositions['uni' | 'lam']) =>
  i === iota ? ret({ i, b, ...z }) :
  !reference_occurs_free(tau, i) ?
    call(main(b), b =>
    ret({ i, b, ...z })) :
  di(safe(i, uniques([...free_references(b), ...free_references(tau)])), ip =>
  di(rename(b, i, ip), b =>
  call(main(b), b =>
  ret({ i: ip, b, ...z })))),
main: (taup: Proposition) => P = proc(visit_proposition({
imp: ({ l, r, ...z }) =>
  call(main(l), l =>
  call(main(r), r =>
  ret({ l, r, ...z }))),
app: ({ l, r, ...z }) =>
  call(main(l), l =>
  call(main(r), r =>
  l.k === 'lam' ? cc(save(l.i, r)(l.b)) :
  ret({ l, r, ...z }))),
ref: ({ i, ...z }) => ret(i === iota ? tau : { i, ...z }),
uni: quantifier, lam: quantifier,
var: ret, err: ret }))
return main }
return (taup: Proposition, iota: Identifier | Variable, tau: Proposition) => save(iota, tau)(taup) }),

aka = run(<P, R>({ proc, call, cc, ret }: Run<Proposition, P, R>) => {
const save = (rho: Rho) => {
const quantifier = (e: Propositions['uni' | 'lam']) =>
  call(save(undefine(e.i, rho))(e.b), b =>
  ret({ ...e, b })),
main: (tau: Proposition) => P = proc(visit_proposition({
app: e =>
  call(main(e.l), l =>
  l.k === 'lam' ?
    call(main(substitute(l.b, l.i, e.r)), d =>
    ret({ ...d })) :
  ret(e)),
ref: e =>
  di(look_up_proposition(e.i, rho), u =>
  !u ? ret(e) :
  call(main(u.d), d =>
  ret({ ...d }))),
var: e =>
  e.d[0] ? cc(main(e.d[0])) :
  ret(e),
uni: quantifier, lam: quantifier,
imp: ret, err: ret }))
return main }
return (tau: Proposition, ctx: Rho) => save(ctx)(tau) }),

query = run(<P, R>({ proc, call, cc, ret }: Run<Proposition, P, R>) => {
const save = (rho: Rho) => {
const quantifier = (e: Propositions['uni' | 'lam']) =>
  call(save(undefine(e.i, rho))(e.b), b =>
  ret({ ...e, b, o: e })),
main: (tau: Proposition) => P = proc(visit_proposition({
app: e =>
  call(main(e.l), l =>
  l.k === 'lam' ?
    call(main(substitute(l.b, l.i, e.r)), d =>
    ret({ ...d, o: e })) :
  ret(e)),
ref: e =>
  di(look_up_proposition(e.i, rho), u =>
  !u ? ret(e) :
  call(main(u.d), d =>
  ret({ ...d, o: e }))),
var: e =>
  e.d[0] ? cc(main(e.d[0])) :
  ret(e),
uni: quantifier, lam: quantifier,
imp: ret, err: ret }))
return main }
return (tau: Proposition, ctx: Rho) => save(ctx)(tau) }),

reduce = run(<P, R>({ proc, call, ret }: Run<Proposition, P, R>) => {
const quantifier = ({ i, b, ...z }: Propositions['uni' | 'lam']) =>
  call(main(b), b =>
  ret({ i, b, ...z })),
main: (tau: Proposition) => P = proc(visit_proposition({
imp: ({ l, r, ...z }) =>
  call(main(l), l =>
  call(main(r), r =>
  ret({ l, r, ...z }))),
app: ({ l, r, ...z }) =>
  call(main(l), l =>
  call(main(r), r =>
  di(l, lp =>
  lp.k === 'lam' ? ret(substitute(lp.b, lp.i, r)) :
  ret({ l, r, ...z })))),
uni: quantifier, lam: quantifier,
ref: ret, var: ret, err: ret }))
return main }),

tidy = (t: Proposition) => { while (t.o) { t = t.o } return t },

beta_equivalent = run(<P, R>({ proc, call, cc, ret }: Run<boolean, P, R>) => {
const save = (rho: Rho, pi: Pi) => {
const main = proc((xp: Proposition, yp: Proposition, spec: boolean): R => {
const
  x = query(xp, rho),
  y = query(yp, rho)

return x.k === 'err' || y.k === 'err' ?
  ret(false) :

x.k === 'var' ?
  y.k === 'var' && x.d === y.d ? ret(true) :
  variable_occurs(y, x.d) ? ret(false) : (
  x.d[0] = tidy(y),
  ret(true)) :
y.k === 'var' ?
  variable_occurs(x, y.d) ? ret(false) :(
  y.d[0] = tidy(x),
  ret(true)) :

x.k === 'ref' && y.k === 'ref' ?
  ret(x.i === y.i) :

y.k === 'uni' ?
  spec ?
    x.k === 'uni' ?
      di(safe(x.i, pi), i =>
      cc(save(rho, [...pi, i])(rename(x.b, x.i, i), y, spec))) :
    cc(main(x, substitute(y.b, y.i, { k: 'var', w: y.w, d: [] }), spec)) :
  x.k === 'uni' ?
    di(safe(y.i, pi), i =>
    cc(save(rho, [...pi, i])(
      rename(x.b, x.i, i),
      rename(y.b, y.i, i), spec))) :
  ret(false) :

y.k ==='lam' ?
  x.k === 'lam' ?
    di(safe(y.i, pi), i =>
    cc(save(rho, [...pi, i])(
      rename(x.b, x.i, i),
      rename(y.b, y.i, i), false))) :
  ret(false) :

y.k === 'imp' ?
  x.k === 'imp' ?
    call(main(x.l, y.l, false), l =>
    !l ? ret(false) :
    cc(main(x.r, y.r, false))) :
  ret(false) :

y.k === 'app' ?
  x.k === 'app' ?
    call(main(x.l, y.l, false), l =>
    !l ? ret(false) :
    cc(main(x.r, y.r, false))) :
  ret(false) :

ret(false) })

return main }
return (x: Proposition, y: Proposition, rho: Rho, pi: Pi) =>
save(rho, pi)(x, y, true) }),

check_proof = run(<P, R>({ proc, call, cc, ret }: Run<Findings, P, R>) => {
const save = (pfx: Context) => {
const
check = proc((e: Proof, g: Goal, tau: Proposition | null, [s, m]: Findings) =>
ret(!tau || beta_equivalent(g.tau, tau, [...pfx.rho, ...g.rho], [...pfx.pi, ...g.pi]) ?
  [[...s, [e, g]], m] :
[[...s, [e, { ...g, found: tau }]], [...m,
  msg(e.w, 'Judgment Error',
    `The goal of this proof,`,
    g.tau,
    `is not its proposition,`,
    tau)]])),

main: (eps: Proof, goal: Goal) => P = proc(visit_proof({

uni: (e, g) => {
  const
    { w, i, b } = e,
    tpp: Proposition = aka(g.tau, [...pfx.rho, ...g.rho]),
    tp: Proposition = tpp.k === 'uni' ? rename(tpp.b, tpp.i, i) :
      { k: 'var', w, d: [] }
  return call(main(b, { ...g,
    tau: tp,
    pi: [...g.pi, i] }), ([bf, bm]) =>
  cc(check(e, g, { k: 'uni', w, i, b: tp }, [bf, [
    ...tpp.k === 'uni' || tpp.k === 'var' ? [] : [
      msg(w, `Judgment Error`, `The goal of this generalization is not quantified.`)],
    ...!proposition_bound(i, g.pi, pfx.pi) ? [] : [
      msg(w, `Name Error`, `This proposition name is already bound in the context.`)],
    ...bm]]))) },

cdp: (e, g) => {
  const
    { w, i, t, b } = e,
    pb = !proof_bound(i, g.sigma, pfx.sigma),
    pc = !t || closed(t, [...pfx.pi, ...g.pi]),
    tn: Proposition | null = t ? reduce(t) : null,
    tpp: Proposition = aka(g.tau, [...pfx.rho, ...g.rho]),
    tp: Proposition = tpp.k === 'var' ? (tpp.d[0] = { k: 'imp', w, l: { k: 'var', w, d: [] }, r: { k: 'var', w, d: [] } }, tpp.d[0]) : tpp,
    l: Proposition = tn || (tp.k === 'imp' ? tp.l : { k: 'var', w, d: [] }),
    r: Proposition = tpp.k === 'imp' ? tpp.r : { k: 'var', w, d: [] }
  return call(main(b, { ...g,
    ...pb && pc ? {
      tau: r,
      sigma: [...g.sigma, { i, t: l }] } : {} }), ([bf, bm]) =>
  cc(check(e, g, { k: 'imp', w, l, r }, [bf, [
    ...tpp.k === 'imp' ? [] : [
      msg(w, `Judgment Error`, `The goal of this conditional proof is not an arrow.`)],
    ...pb ? [] : [
      msg(w, `Name Error`, `The proof name of this conditional proof is bound in the context.`)],
    ...!t || pc ? [] : [
      msg(t.w, `Name Error`, `This proposition is not closed.`)],
    ...bm]]))) },

def: (e, g) => {
  const
    { w, i, d, b } = e,
    dn: Proposition = reduce(d),
    pb: boolean = !proposition_bound(i, g.pi, pfx.pi),
    pc: boolean = closed(d, [...pfx.pi, ...g.pi])
  return call(main(b, { ...g,
    ...pb && pc ? { pi: [...g.pi, i], rho: [...g.rho, { i, d: dn }] } : {} }), ([bf, bm]) =>
  cc(check(e, g, null, [bf, [...bm,
    ...pb ? [] : [
      msg(w, `Name Error`, `This proposition name is already bound in the context.`)],
    ...pc ? [] : [
      msg(d.w, `Name Error`, `This proposition is not closed.`)]]]))) },

lem: (e, g) => {
  const
    { w, i, t, d, b } = e,
    tn: Proposition = t ? reduce(t) :{ k: 'var', w, d: [] }
  return call(main(d, { ...g,
    tau: tn }), ([df, dm]) =>
  call(main(b, { ...g,
    sigma: [...g.sigma, { i, t: tn }] }), ([bf, bm]) =>
  cc(check(e, g, null, [[...df, ...bf], [...dm, ...bm,
    ...!proof_bound(i, g.sigma, pfx.sigma) ? [] : [
      msg(w, `Name Error`, `This proof name is already bound in the context.`)],
    ...!t || closed(t, [...pfx.pi, ...g.pi]) ? [] : [
      msg(t.w, `Name Error`, `This proposition is not closed.`)]]])))) },

spe: (e, g) => {
  const
    { w, l, r } = e,
    pc: boolean = closed(r, [...pfx.pi, ...g.pi]),
    tl: Proposition = { k: 'var', w, d: [] }
  return call(main(l, { ...g, tau: tl }), ([lf, lm]) => {
  const
    lpp: Proposition = aka(tl, [...pfx.rho, ...g.rho]),
    pu = lpp.k === 'uni',
    lp: Proposition | null = pc && pu ? substitute(lpp.b, lpp.i, reduce(r)) : null
  return cc(check(e, g, lp, [lf, [...lm,
    ...pu ? [] : [
      msg(l.w, `Judgment Error`, `This proof is specialized, but its proposition is not quantified.`)],
    ...pc ? [] : [
      msg(r.w, `Name Error`, `This proposition is not closed.`)]]])) }) },

mop: (e, g) => {
  const
    { w, l, r } = e,
    v: Proposition = { k: 'var', w, d: [] }
  return call(main(l, { ...g,
    tau: { k: 'imp', w, l: v, r: g.tau }}), ([lf, lm]) =>
  call(main(r, { ...g,
    tau: v }), ([rf, rm]) =>
  cc(check(e, g, null, [[...lf, ...rf], [...lm, ...rm]])))) },

ref: (e, g) => {
  const
    { w, i } = e,
    u: Judgment | undefined = look_up_proof(i, g.sigma, pfx.sigma)
  return cc(check(e, g, u ? u.t : null, [[], [
    ...u ? [] : [
      msg(w, `Name Error`, `This proof name is not bound in the context.`)]]])) },

prt: (e, g) => {
  const
    { w, d, b } = e
  return call(main(b, g), ([bf, bm]) => {
  const
    dp: Proposition = aka(reduce(d), [...pfx.rho, ...g.rho])
  return cc(check(e, g, null, [bf, [
    msg(w, 'Query', dp), ...bm]])) }) },

err: (e, g) => {
  const
    { w } = e
  return cc(check(e, g, null, [[], [
    msg(w, 'Goal', g)]])) } }))

return main }
return (eps: Proof, pfx: Context, g: Goal) => save(pfx)(eps, g) })

export const

scan_article = (a: Statement | null, get_import: (name: string) => Module | null): Module => {
const exp = run(<P, R>({ proc, cc, ret }: Run<Module, P, R>) => {
const inner: (e: Statement, ctx: Context, exp: Module) => P = proc(visit_statement({
  imp: ({ a, i }, ctx, exp) => {
    const data = get_import(i)
    return cc(main(a, !data ? ctx : { ...ctx,
      sigma: [...ctx.sigma, ...data.sigma],
      pi: [...ctx.pi, ...data.pi] }, exp)) },
  exf: ({ a, i }, ctx, exp) => {
    const u = ctx.sigma.find(({ i: ip }) => i === ip)
    return cc(main(a, ctx, !u ? exp :
      { ...exp, sigma: [...exp.sigma, u] })) },
  prt: ({ a }, ctx, exp) => cc(main(a, ctx, exp)),
  def: ({ a, i, d }, ctx, exp) =>
    cc(main(a, proposition_bound0(i, ctx.pi) || !closed(d, ctx.pi) ? ctx : { ...ctx,
      pi: [...ctx.pi, i],
      rho: [...ctx.rho, { i, d }]}, exp)),
  thm: ({ a, i, t }, ctx, exp) =>
    cc(main(a, proof_bound(i, [], ctx.sigma) || t && !closed(t, ctx.pi) ? ctx : { ...ctx,
      sigma: [...ctx.sigma, { i, t }]}, exp)) })),
main = proc((e: Statement | null, ctx: Context, exp: Module) => e ? cc(inner(e, ctx, exp)) : ret(exp))
return main })(a,
  { sigma: [], rho: [], pi: [] },
  { sigma: [], pi: [] })
exp.pi.push(...uniques(
  exp.sigma.map(({ t }) => free_references(t)).flat(1)))
return exp },

check_article = (a: Statement | null, get_import: (name: string) => Module | null) =>
run(<P, R>({ proc, cc, ret }: Run<Findings, P, R>) => {
const inner: (e: Statement, ctx: Context, f: Findings) => P = proc(visit_statement({
imp: ({ a, w, i }, ctx, [f, m]) => {
  const data = get_import(i)
  return cc(main(a, !data ? ctx : { ...ctx,
      sigma: [...ctx.sigma, ...data.sigma],
      pi: [...ctx.pi, ...data.pi] }, [f, [...m,
    ...data ? [] : [msg(w, 'Import Error', 'No such file.')]]])) },
exf: ({ a, w, i }, ctx, [f, m]) => {
  return cc(main(a, ctx, [f, [...m,
    ...ctx.sigma.some(({ i: ip }) => i === ip) ? [] : [
      msg(w, 'Name Error', `This proof name is not bound in the context.`)]]])) },
prt: ({ a, w, d }, ctx, [f, m]) => {
  const dp = aka(reduce(d), ctx.rho)
  return cc(main(a, ctx, [f, [...m, msg(w, 'Query', dp)]])) },
def: ({ a, w, i, d }, ctx, [f, m]) => {
  const c: Messages = []
  if (proposition_bound0(i, ctx.pi)) {
    c.push(msg(w, `Name Error`, `The proposition name of this definition is bound in the context.`)) }
  if (!closed(d, ctx.pi)) {
    c.push(msg(d.w, `Name Error`, `This proposition is not closed.`)) }
  return cc(main(a, c.length !== 0 ? ctx : { ...ctx,
    pi: [...ctx.pi, i],
    rho: [...ctx.rho, { i, d }] }, [f, [...m, ...c]])) },
thm: ({ a, w, i, t, d }, ctx, [f, m]) => {
  const c: Messages = []
  if (proof_bound0(i, ctx.sigma)) {
    c.push(msg(w, `Name Error`, `The proof name of this theorem is bound in the context.`)) }
  if (t && !closed(t, ctx.pi)) {
    c.push(msg(t.w, `Name Error`, `This proposition is not closed.`))}
  if (c.length !== 0) {
    return cc(main(a, ctx, [f, [...m, ...c]])) }
  t = reduce(t)
  let [_tp, mp] = check_proof(d, ctx, { tau: t, sigma: [], rho: [], pi: [] })
  return cc(main(a, { ...ctx, sigma: [...ctx.sigma, { i, t}]}, [f, [...m, ...c, ...mp]])) } })),
main = proc((e: Statement | null, ctx: Context, f: Findings) => e ? cc(inner(e, ctx, f)) : ret(f))
return main })(a, { sigma: [], rho: [], pi: [] }, [[], []])