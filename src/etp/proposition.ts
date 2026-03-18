import { Run, run } from './run.js'
import { di, uniques } from '../common/util/di.js'
import {
  Rho, Pi, Messages,
  msg, look_up_proposition_rho, proposition_bound_pi, safe, undefine }
  from './context.js'
import {
  Identifier, Proposition, Propositions, Variable, visit_proposition }
  from './abstract.js'
import { TextRange } from './scanner.js'

export const

uni = (w: TextRange, i: Identifier, b: Proposition): Propositions['uni'] =>
({ k: 'uni', w, i, b }),
imp = (w: TextRange, l: Proposition, r: Proposition): Propositions['imp'] =>
({ k: 'imp', w, l, r }),
mvar = (w: TextRange, d: Variable): Propositions['var'] =>
({ k: 'var', w, d }),

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
ref: ({ w, i }) => ret(proposition_bound_pi(i)(ctx) ? [] : [
  msg(w, `Name Error`,
    `This proposition name is not bound in the context.`)]) }))
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
  di(look_up_proposition_rho(e.i)(rho), u =>
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
  di(look_up_proposition_rho(e.i)(rho), u =>
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
      ret({ ...uni(t.w, ip, imp(dr.w, tp.l, r )), o: t }))) :
    ret({ ...uni(t.w, dr.i, imp(dr.w, tp.l, dr.b)), o: t })):
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
cc(m(false, x, y, true)))) } })
