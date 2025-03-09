import { cnj, TypeTree, typ_cnj, typ_dsj, typ_abs, typ_iov, typ_rec, TypeMap, ref, iov, rec, abs, dsj, TRef, typ_ext, ext } from "./graph.js"
import { di } from "./di.js"
import { homproc, jmp, Process } from "./run.js"

export const rename: (nt: () => TRef, t: TypeTree, m: { [i: string]: TRef }) => TypeTree = (nt, t, m) => homproc((call, ret) => {
const p: (l: TypeMap, k: string[], r: TypeMap, ml: { [i: string]: TRef }) => Process = (l, k, r, m) => () =>
  !k[0] ? ret(typ_rec(r)) :
  di(k[0], i =>
  call(s(l[i] as TypeTree, m), de =>
  jmp(p(l, k.slice(1), { ...r, [i]: de }, m))))
const s: (t: TypeTree, m: { [i: string]: TRef }) => Process = (t, m) => () =>
  t.kind === ref ? ret(m[t.name] || t) :
  t.kind === ext ?
    call(s(t.operand, m), dx =>
    ret(typ_ext(dx))) :
  t.kind === iov ?
    call(s(t.operand, m), dx =>
    ret(typ_iov(dx))) :
  t.kind === rec ? jmp(p(t.elements, Object.keys(t.elements), {}, m)) :
  t.kind === abs ?(() => {
    const varsp: [string, boolean][] = []
    const mp: { [i: string]: TRef } = { ...m }
    for (const v of t.vars) {
      const n = mp[v[0]] || nt()
      varsp.push([n.name, v[1]])
      mp[v[0]] = n }
    return call(s(t.lhs, mp), dx =>
    call(s(t.rhs, mp), dy =>
    ret(typ_abs(varsp, dx, dy)))) })()  :
  t.kind === cnj ?
    call(s(t.lhs, m), dx =>
    call(s(t.rhs, m), dy =>
    ret(typ_cnj(dx, dy)))) :
  t.kind === dsj ?
    call(s(t.lhs, m), dx =>
    call(s(t.rhs, m), dy =>
    ret(typ_dsj(dx, dy)))) :
  ret(t)
return s(t, m) })
