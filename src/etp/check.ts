import { Run, run } from './run.js'
import { di, uniques } from '../common/util/di.js'
import {
  Sigma,
  Rho,
  Pi,
  Goal,
  Messages,
  msg,
  Judgment,
  Module,
  Prefix } from './context.js'
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
export type StatementTranscript = [Statement, Prefix][]
export type Findings = [Transcript, Messages]
export type StatementFindings = [StatementTranscript, Transcript, Messages]

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
var: ({ d }) =>
  d === v ? ret(true) :
  d[0] ? cc(main(d[0])) :
  ret(false) }))
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

closed = run(<P, R>({ proc, call, cc, ret }: Run<Messages, P, R>) => {
const save = (ctx: Pi) => {
const
quantifier = ({ i, b }: Propositions['uni' | 'lam']) =>
  cc(save([...ctx, i])(b)),
binary = ({ l, r }: Propositions['imp' | 'app']) =>
  call(main(l), l => call(main(r), r => ret([...l, ...r]))),
def = () => ret([]),
main: (tau: Proposition) => P = proc(visit_proposition({
uni: quantifier, lam: quantifier,
imp: binary, app: binary,
var: def, err: def,
ref: ({ w, i }) => ret(proposition_bound0(i, ctx) ? [] : [msg(w, 'Name Error', 'This proposition name is not bound in the context.')]) }))
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

query = run(<P, R>({ proc, call, ret }: Run<Proposition, P, R>) => {
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
  e.d[0] ?
    call(main(e.d[0]), d =>
    ret({ ...d, o: e })) :
  ret(e),
uni: quantifier, lam: quantifier,
imp: ret, err: ret }))
return main }
return (tau: Proposition, ctx: Rho) => save(ctx)(tau) }),

tidy = (t: Proposition) => { while (t.o) { t = t.o } return t },

specialize = (pfx: Prefix, g: Goal) => {
for (;;) {
  const taup = aka(g.tau, [...pfx.rho, ...g.rho])
  if (taup.k === 'uni') {
    const i = safe(taup.i, [...g.pi, ...g.hi])
    g = { ...g, tau: rename(taup.b, taup.i, i), hi: [...g.hi, i] }
    continue }
  break }
return g },

gamma = (rho: Rho) => run(<P, R>({ proc, call, ret }: Run<Proposition, P, R>) => {
const main = proc((t: Proposition): R =>
  di(query(t, rho), tp =>
  tp.k === 'uni' ?
    ret(tp) :
  tp.k === 'imp' ?
    call(main(tp.r), dr =>
    dr.k !== 'uni' ? ret(t) :
    reference_occurs_free(tp.l, dr.i) ?
      di(safe(dr.i, uniques([...free_references(tp.l), ...free_references(dr.b)])), ip =>
      di(rename(dr.b, dr.i, ip), r =>
      ret({ k: 'uni', w: t.w, i: ip, b: { k: 'imp', w: dr.w, l: tp.l, r }, o: t }))) :
    ret({ k: 'uni', w: t.w, i: dr.i, b: { k: 'imp', w: dr.w, l: tp.l, r: dr.b }, o: t })):
  ret(t)))
return main }),

beta_equivalent = run(<P, R>({ branch, proc, call, cc, ret }: Run<boolean, P, R>) => {
const save = (rho: Rho, pi: Pi, hi: Pi) => {
const main = proc((disj: boolean, xp: Proposition, yp: Proposition, spec: boolean): R => {
const
  x = disj ? reduce(xp) : query(xp, rho),
  y = disj ? reduce(yp) : query(yp, rho)

return x.k === 'err' || y.k === 'err' ?
  ret(false) :

x.k === 'var' ?
  y.k === 'var' && x.d === y.d ? ret(true) :
  disj && x.d[0] ? cc(main(true, x.d[0], y, spec)) :
  variable_occurs(y, x.d) ? ret(false) : (
  x.d[0] = tidy(y),
  ret(true)) :
y.k === 'var' ?
  disj && y.d[0] ? cc(main(true, x, y.d[0], spec)) :
  variable_occurs(x, y.d) ? ret(false) : (
  y.d[0] = tidy(x),
  ret(true)) :

x.k === 'ref' && y.k === 'ref' ?
  ret(x.i === y.i) :

x.k === 'uni' && spec ?
  di(safe(x.i, [...pi, ...hi]), i =>
  cc(save(rho, pi, [...hi, i])(disj, rename(x.b, x.i, i), y, true))) :

y.k === 'uni' ?
  spec ?
    cc(main(disj, x, substitute(y.b, y.i, { k: 'var', w: y.w, d: [] }), true)) :
  di(gamma(rho)(x), xg =>
  xg.k === 'uni' ?
    di(safe(y.i, [...pi, ...hi]), i =>
    cc(save(rho, pi, [...hi, i])(disj,
      rename(xg.b, xg.i, i),
      rename(y.b, y.i, i), spec))) :
  ret(false)) :

y.k ==='lam' ?
  x.k === 'lam' ?
    di(safe(y.i, [...pi, ...hi]), i =>
    cc(save(rho, pi, [...hi, i])(disj,
      rename(x.b, x.i, i),
      rename(y.b, y.i, i), false))) :
  ret(false) :

y.k === 'imp' ?
  x.k === 'uni' ?
    di(gamma(rho)(y), yg =>
    yg.k === 'uni' ?
      cc(main(disj, x, yg, spec)) :
    ret(false)) :
  x.k === 'imp' ?
    call(main(disj, y.l, x.l, spec), l =>
    !l ? ret(false) :
    cc(main(disj, x.r, y.r, spec))) :
  ret(false) :

y.k === 'app' ?
  x.k === 'app' ?
    call(main(disj, x.l, y.l, false), l =>
    !l ?
      !disj ? ret(false) :
      cc(main(false, x, y, spec)) :
    cc(main(disj, x.r, y.r, false))) :
  !disj ? ret(false) :
  cc(main(false, x, y, spec)) :

x.k === 'app' ?
  !disj ? ret(false) :
  cc(main(false, x, y, spec)) :

ret(false) })

return main }
return (x: Proposition, y: Proposition, rho: Rho, pi: Pi, hi: Pi) => {
const
  m = save(rho, pi, hi)
return branch(() => call(m(true, x, y, true), dr =>
dr ? ret(true) :
cc(m(false, x, y, true)))) } }),

check_proof = run(<P, R>({ proc, call, cc, ret }: Run<Findings, P, R>) => {
const save = (pfx: Prefix) => {
const
check = proc((e: Proof, g: Goal, tau: Proposition | null, [s, m]: Findings) =>
ret(!tau || beta_equivalent(g.tau, tau, [...pfx.rho, ...g.rho], [...pfx.pi, ...g.pi], g.hi) ?
  [[...s, [e, !tau ? g : { ...g, found: tau }]], m] :
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
  g = specialize(pfx, g)
  const
    { w, i, t, b } = e,
    pb = !proof_bound(i, g.sigma, pfx.sigma),
    pc: Messages = !t ? [] : closed(t, [...pfx.pi, ...g.pi]),
    tn: Proposition | null = t ? reduce(t) : null,
    tpp: Proposition = aka(g.tau, [...pfx.rho, ...g.rho]),
    tp: Proposition = tpp.k === 'var' ? (tpp.d[0] = { k: 'imp', w, l: { k: 'var', w, d: [] }, r: { k: 'var', w, d: [] } }, tpp.d[0]) : tpp,
    l: Proposition = tn || (tp.k === 'imp' ? tp.l : { k: 'var', w, d: [] }),
    r: Proposition = tp.k === 'imp' ? tp.r : { k: 'var', w, d: [] }
  return call(main(b, { ...g,
    ...pb && pc.length === 0 ? {
      tau: r,
      sigma: [...g.sigma, { i, t: l }] } : {} }), ([bf, bm]) =>
  cc(check(e, g, { k: 'imp', w, l, r }, [bf, [
    ...tp.k === 'imp' ? [] : [
      msg(w, `Judgment Error`, `The goal of this conditional proof is not an arrow.`)],
    ...pb ? [] : [
      msg(w, `Name Error`, `The proof name of this conditional proof is bound in the context.`)],
    ...pc,
    ...bm]]))) },

def: (e, g) => {
  const
    { w, i, d, b } = e,
    dn: Proposition = reduce(d),
    pb: boolean = !proposition_bound(i, g.pi, pfx.pi),
    pc: Messages = closed(d, [...pfx.pi, ...g.pi])
  return call(main(b, { ...g,
    ...pb && pc.length === 0 ? { pi: [...g.pi, i], rho: [...g.rho, { i, d: dn }] } : {} }), ([bf, bm]) =>
  cc(check(e, g, null, [bf, [...bm,
    ...pb ? [] : [
      msg(w, `Name Error`, `This proposition name is already bound in the context.`)],
    ...pc]]))) },

lem: (e, g) => {
  const
    { w, i, t, d, b } = e,
    tn: Proposition = t ? reduce(t) : { k: 'var', w, d: [] },
    pc: Messages = !t ? [] : closed(t, [...pfx.pi, ...g.pi])
  return call(main(d, { ...g,
    tau: tn }), ([df, dm]) => {
  return call(main(b, pc.length !== 0 ? g : { ...g,
    sigma: [...g.sigma, { i, t: tn }] }), ([bf, bm]) =>
  cc(check(e, g, null, [[...df, ...bf], [...dm, ...bm,
    ...!proof_bound(i, g.sigma, pfx.sigma) ? [] : [
      msg(w, `Name Error`, `This proof name is already bound in the context.`)],
    ...pc]]))) }) },

spe: (e, g) => {
  g = specialize(pfx, g)
  const
    { w, l, r } = e,
    pc: Messages = closed(r, [...pfx.pi, ...g.pi]),
    tl: Proposition = { k: 'var', w, d: [] }
  return call(main(l, { ...g, tau: tl }), ([lf, lm]) => {
  const
    lpp: Proposition = aka(tl, [...pfx.rho, ...g.rho]),
    pu = lpp.k === 'uni',
    lp: Proposition | null = pc.length === 0 && pu ? substitute(lpp.b, lpp.i, reduce(r)) : null
  return cc(check(e, g, lp, [lf, [...lm,
    ...pu ? [] : [
      msg(l.w, `Judgment Error`, `This proof is specialized, but its proposition is not quantified.`)],
    ...pc]])) }) },

mop: (e, g) => {
  g = specialize(pfx, g)
  const
    { w, l, r } = e,
    v: Proposition = { k: 'var', w, d: [] }
  return call(main(l, { ...g,
    tau: { k: 'imp', w, l: v, r: g.tau }}), ([lf, lm]) =>
  call(main(r, { ...g,
    tau: v }), ([rf, rm]) =>
  cc(check(e, g, null, [[...lf, ...rf], [...lm, ...rm]])))) },

ref: (e, g) => {
  g = specialize(pfx, g)
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
  return cc(check(e, g, null, [[], []])) } }))

return main }
return (eps: Proof, pfx: Prefix, g: Goal) => save(pfx)(eps, g) })

export const

look_up_proposition = (i: Identifier, ctx: Rho) =>
ctx.findLast(({ i: ip }) => ip === i),

look_up_proof = (i: Identifier, ctx: Sigma, pfx: Sigma) =>
cascade(ctx => ctx.findLast(({ i: ip }) => ip === i), ctx, pfx),

reduce = run(<P, R>({ proc, call, cc, ret }: Run<Proposition, P, R>) => {
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
var: ({ d, ...z }) =>
  d[0] ? cc(main(d[0])) :
  ret({ d, ...z }),
uni: quantifier, lam: quantifier,
ref: ret, err: ret }))
return main }),

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
return (tau: Proposition, rho: Rho) => save(rho)(tau) }),

scan_article = (a: Statement | null, get_import: (name: string) => Module | null): Module => {
const exp = run(<P, R>({ proc, cc, ret }: Run<Module, P, R>) => {
const inner: (e: Statement, pfx: Prefix, exp: Module) => P = proc(visit_statement({
  imp: ({ a, i }, pfx, exp) => {
    const data = get_import(i)
    return cc(main(a, !data ? pfx : { ...pfx,
      sigma: [...pfx.sigma, ...data.sigma],
      pi: [...pfx.pi, ...data.pi] }, exp)) },
  exf: ({ a, i }, pfx, exp) => {
    const u = pfx.sigma.find(({ i: ip }) => i === ip)
    return cc(main(a, pfx, !u ? exp :
      { ...exp, sigma: [...exp.sigma, u] })) },
  prt: ({ a }, pfx, exp) => cc(main(a, pfx, exp)),
  def: ({ a, i, d }, pfx, exp) =>
    cc(main(a, { ...pfx,
      pi: [...pfx.pi, i],
      rho: [...pfx.rho, { i, d }]}, exp)),
  thm: ({ a, i, t }, pfx, exp) =>
    cc(main(a, { ...pfx,
      sigma: [...pfx.sigma, { i, t }]}, exp)) })),
main = proc((e: Statement | null, pfx: Prefix, exp: Module) => e ? cc(inner(e, pfx, exp)) : ret(exp))
return main })(a,
  { sigma: [], rho: [], pi: [] },
  { sigma: [], pi: [] })
exp.pi.push(...uniques(
  exp.sigma.map(({ t }) => free_references(t)).flat(1)))
return exp },

check_article = (a: Statement | null, get_import: (name: string) => Module | null) =>
run(<P, R>({ proc, cc, ret }: Run<StatementFindings, P, R>) => {
const inner: (e: Statement, pfx: Prefix, f: StatementFindings) => P = proc(visit_statement({
imp: ({ a, w, i }, pfx, [sf, f, m]) => {
  const data = get_import(i)
  return cc(main(a, !data ? pfx : { ...pfx,
      sigma: [...pfx.sigma, ...data.sigma],
      pi: [...pfx.pi, ...data.pi] }, [sf, f, [...m,
    ...data ? [] : [msg(w, 'Import Error', 'No such file.')]]])) },
exf: ({ a, w, i }, pfx, [sf, f, m]) => {
  return cc(main(a, pfx, [sf, f, [...m,
    ...pfx.sigma.some(({ i: ip }) => i === ip) ? [] : [
      msg(w, 'Name Error', `This proof name is not bound in the context.`)]]])) },
prt: ({ a, w, d }, pfx, [sf, f, m]) => {
  const dp = aka(reduce(d), pfx.rho)
  return cc(main(a, pfx, [sf, f, [...m, msg(w, 'Query', dp)]])) },
def: (e, pfx, [sf, f, m]) => {
  const
    { a, w, i, d } = e,
    pb = proposition_bound0(i, pfx.pi),
    pc: Messages = closed(d, pfx.pi)
  return cc(main(a, pb || pc.length !== 0 ? pfx : { ...pfx,
    pi: [...pfx.pi, i],
    rho: [...pfx.rho, { i, d }] }, [[...sf, [e, pfx]], f, [...m,
      ...pb ? [] : [
        msg(w, `Name Error`, `The proposition name of this definition is bound in the context.`)],
      ...pc]])) },
thm: (e, pfx, [sf, f, m]) => {
  const
    { a, w, i, t, d } = e,
    pb = !proof_bound0(i, pfx.sigma),
    pc: Messages = !t ? [] : closed(t, pfx.pi)
  const tp = reduce(t)
  let [pp, pm] = check_proof(d, pfx, { tau: tp, sigma: [], rho: [], pi: [], hi: [] })
  return cc(main(a, { ...pfx, sigma: [...pfx.sigma, { i, t: tp }]}, [[...sf, [e, pfx]], [...f, ...pp], [...m,
    ...pb ? [] : [
      msg(w, `Name Error`, `The proof name of this theorem is bound in the context.`)],
    ...pc,
    ...pm]])) } })),
main = proc((e: Statement | null, pfx: Prefix, f: StatementFindings) => e ? cc(inner(e, pfx, f)) : ret(f))
return main })(a, { sigma: [], rho: [], pi: [] }, [[], [], []])