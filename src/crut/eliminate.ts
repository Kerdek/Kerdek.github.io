import { apply_inequalities, Inequalities } from "./constraints.js"
import { di } from "./di.js"
import { type_vars } from "./free_vars.js"
import { any, cnj, dsj, ref, typ_cnj, typ_dsj, typ_unk, TypeTree, unk } from "./graph.js"
import { print_inequalities } from "./print.js"

const simplify: (i: string, t: TypeTree) => TypeTree = (i, t) =>
t.kind === ref ? t.name === i ? typ_unk() : t :
t.kind === cnj ?
  di(simplify(i, t.lhs), l =>
  di(simplify(i, t.rhs), r =>
  l.kind === unk || r.kind === any ? r :
  l.kind === any || r.kind === unk ? l :
  typ_cnj(l, r))) :
t.kind === dsj ?
  di(simplify(i, t.lhs), l =>
  di(simplify(i, t.rhs), r =>
  l.kind === unk || r.kind === any ? l :
  l.kind === any || r.kind === unk ? r :
  typ_dsj(l, r))) :
t

export const eliminate: (system: Inequalities, vars: [string, boolean][], b: boolean) => [Inequalities, Inequalities] | string = (system, vars, b2) => {
console.log(`Eliminating \`${vars.map(x => `${x[1] ? '+' : '-'}${x[0]}`).join(' ')}\` from \`${print_inequalities(system)}\`.`)
const orig = system
for (const [v, b] of vars) {
  for (const i in system.less) {
    system.less[i] = simplify(i, system.less[i] as TypeTree) }
  for (const i in system.greater) {
    system.greater[i] = simplify(i, system.greater[i] as TypeTree) }
  if (
    system.less[v] && type_vars(system.less[v] as TypeTree, b).some(x => v === x[0] && b === x[1]) ||
    system.greater[v] && type_vars(system.greater[v] as TypeTree, !b).some(x => v === x[0] && b === x[1])) {
    return `Refusing to infer inductive type from the following system:\n${print_inequalities(system)}` }
  system = apply_inequalities(system,
    b2 !== b ?
      { less: system.less[v] ? { [v]: system.less[v] as TypeTree } : {}, greater: {} } :
      { less: {}, greater: system.greater[v] ? { [v]: system.greater[v] as TypeTree } : {} } )}
const taken: Inequalities = { less: {}, greater: {} }
const given: Inequalities = { less: {}, greater: {} }
for (const i in system.less) {
  (vars.some(v => v[0] === i) ? taken : given).less[i] = system.less[i] as TypeTree }
for (const i in system.greater) {
  (vars.some(v => v[0] === i) ? taken : given).greater[i] = system.greater[i] as TypeTree }
console.log(`Eliminating \`${vars.map(x => `${x[1] ? '+' : '-'}${x[0]}`).join(' ')}\` from \`${print_inequalities(orig)}\` gave \`${print_inequalities(taken)}\` and \`${print_inequalities(given)}\`.`)
  return [taken, given] }