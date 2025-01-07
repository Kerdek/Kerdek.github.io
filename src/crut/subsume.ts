import { conjoin_inequalities, disjoin_inequalities, empty_inequalities, Inequalities } from "./constraints.js"
import { di } from "./di.js"
import { result } from "./function.js"
import { abs, aka, any, bol, cnj, dsj, ext, iov, lit, num, rec, ref, str, TypeMap, TypeTree, unk } from "./graph.js"
import { print_inequalities, print_type } from "./print.js"
import { homproc, jmp, Process } from "./run.js"


// export const subsume_dnf_function: (l: TypeDNFFunction, r: TypeDNFFunction) => Constraints | string = (l, r) =>
// di(result_function_dnf(l, r[1]), dr =>
// typeof dr === "string" ? dr :
// di(subsume_dnf(dr[0], r[2]), dy =>
// typeof dy === "string" ? dy :
// di(conjoin_constraints(dr[1], dy), c =>
// typeof c === "string" ? c :
// di(eliminate(c, r[0]), soln =>
// typeof soln === "string" ? soln :
// soln[1]))))

// export const subsume_dnf_functions: (l: TypeDNFFunction[], r: TypeDNFFunction[]) => Constraints | string = (l, r) =>;

// export const subsume_dnf_record: (l: Equations, r: Equations) => Constraints | string = (l, r) =>;


// export const subsume_dnf_element: (l: TypeDNFElement, r: TypeDNFElement) => Constraints | string = (l, r) => {
// if (l.kind === any) { return [empty_inequalities()] }
// if (r.kind === unk) { return [{}] }
// let c: Constraints = [{}]
// if (l.kind === num && r.kind === num) { return [{}] }
// if (l.kind === str && r.kind === str) { return [{}] }
// if (l.kind === bol && r.kind === bol) { return [{}] }
// if (l.kind === lit) {
//   if (
//     typeof l.literal === "boolean" && r.kind === bol ||
//     typeof l.literal === "number" && r.kind === num ||
//     typeof l.literal === "string" && r.kind === str) {
//     return [{}] }
//   if (r.kind === lit && l.literal === r.literal) {
//     return [{}] } }
// if (l.kind === iov && r.kind === iov) { return subsume_dnf(l.io, r.io) }
// if (l.kind === abs && r.kind === abs) { return subsume_dnf_functions(l.functions, r.functions) }
// if (l.kind === rec && r.kind === rec) { return subsume_dnf_record(l.elements, r.elements) }
// if (l.kind === unk) {}
// }

// export const subsume_dnf: (l: TypeDNF, r: TypeDNF) => Constraints | string = (l, r) => {
// let c: Constraints = []
// for (const ll of l) {
//   let m: Constraints | string = ""
//   for (const rr of r) {
//     const z = subsume_dnf_element(ll, rr)
//     if (typeof z === "string") {
//       m = `${m}\n${z}` }
//     else if (typeof m === "string") {
//       m = z }
//     else {
//       m = disjoin_constraints(m, z) } }
//   if (typeof m === "string") {
//     return m }
//   const z = conjoin_constraints(c, m)
//   if (typeof z === "string") {
//     return z }
//   c = z }
// return c }

const m = new Map<TypeTree, Map<TypeTree, Inequalities>>()
export const subsume: (l: TypeTree, r: TypeTree) => Inequalities | string = (l, r) => {
const o: Inequalities | string = homproc((call, ret) => {
const p: (l: TypeMap, r: TypeMap, k: string[]) => Process = (l, r, k) => () =>
  !k[0] ? ret(empty_inequalities()) :
  !l[k[0]] ? ret(`Missing property \`${k[0]}\`.`) :
  call(s(l[k[0]] as TypeTree, r[k[0]] as TypeTree), vars =>
  typeof vars === "string" ? ret(vars) :
  call(p(l, r, k.slice(1)), rest =>
  typeof rest === "string" ? ret(rest) :
  ret(conjoin_inequalities(vars, rest))))
const q: (l: TypeTree[], r: TypeTree[]) => Process = (l, r) => () =>
  !r[0] ? ret(empty_inequalities()) :
  !l[0] ? ret(`Not enough tuple elements.`) :
  call(s(l[0], r[0]), vars =>
  typeof vars === "string" ? ret(vars) :
  call(q(l.slice(1), r.slice(1)), rest =>
  typeof rest === "string" ? ret(rest) :
  ret(conjoin_inequalities(vars, rest))))
const s: (l: TypeTree, r: TypeTree) => Process = (l, r) => () => call(() =>
  di(m.get(l), dl =>
  dl ?
    di(dl.get(r), dr =>
    dr ? ret(dr) : (
    dl.set(r, empty_inequalities()),
    call(sp(l, r), dz =>
    typeof dz === "string" ? ret(dz) : (
    dl.set(r, dz),
    ret(dz))))) :
  di(new Map<TypeTree, Inequalities>(), dl => (
  m.set(l, dl),
  dl.set(r, empty_inequalities()),
  call(sp(l, r), dz =>
  typeof dz === "string" ? ret(dz) : (
  dl.set(r, dz),
  ret(dz)))))), o => (
  typeof o !== "string" && console.log(`\`${print_type(l)}\` subsumes\`${print_type(r)}\` with constraints \`${print_inequalities(o)}\`.`),
  ret(o)))
const sp: (l: TypeTree, r: TypeTree) => Process = (l, r) => () =>
  l === r ? ret(empty_inequalities()) :
  l.kind === any ? ret(empty_inequalities()) :
  r.kind === unk ? ret(empty_inequalities()) :
  l.kind === aka ? jmp(s(l.identity, r)) :
  r.kind === aka ? jmp(s(l, r.identity)):
  l.kind === ref && r.kind === ref ?
    l.name === r.name ? ret(empty_inequalities()) :
    di(l, dl =>
    typeof dl === "string" ? ret(dl) :
    di(r, dr =>
    typeof dr === "string" ? ret(dr) :
    ret({ less: { [l.name]: dr }, greater: { [r.name]: dl } }))) :
  r.kind === ref ?
    di(l, dl =>
    typeof dl === "string" ? ret(dl) :
    ret({ less: {}, greater: { [r.name]: dl } })) :
  l.kind === ref ?
    di(r, dr =>
    typeof dr === "string" ? ret(dr) :
    ret({ less: { [l.name]: dr }, greater: {} })) :
  l.kind === num && r.kind === num ? ret(empty_inequalities()) :
  l.kind === str && r.kind === str ? ret(empty_inequalities()) :
  l.kind === bol && r.kind === bol ? ret(empty_inequalities()) :
  l.kind === dsj ?
    call(s(l.lhs, r), da =>
    typeof da === "string" ? ret(`\`${print_type(l)}\` does not subsume \`${print_type(r)}\`.\n${da}`) :
    call(s(l.rhs, r), db =>
    typeof db === "string" ? ret(`\`${print_type(l)}\` does not subsume \`${print_type(r)}\`.\n${db}`) :
    ret(conjoin_inequalities(da, db)))) :
  r.kind === cnj ?
    call(s(l, r.lhs), da =>
    typeof da === "string" ? ret(`\`${print_type(l)}\` does not subsume \`${print_type(r)}\`.\n${da}`) :
    call(s(l, r.rhs), db =>
    typeof db === "string" ? ret(`\`${print_type(l)}\` does not subsume \`${print_type(r)}\`.\n${db}`) :
    ret(conjoin_inequalities(da, db)))) :
  l.kind === cnj ?
    call(s(l.lhs, r), da =>
    typeof da === "string" ?
      call(s(l.rhs, r), db =>
      typeof db === "string" ? ret(`\`${print_type(l)}\` does not subsume \`${print_type(r)}\`.\n${da}\n${db}`) :
      ret(db)) :
    call(s(l.rhs, r), db =>
    typeof db === "string" ? ret(da) :
    ret(disjoin_inequalities(da, db)))) :
  r.kind === dsj ?
    call(s(l, r.lhs), da =>
    typeof da === "string" ?
      call(s(l, r.rhs), db =>
      typeof db === "string" ? ret(`\`${print_type(l)}\` does not subsume \`${print_type(r)}\`.\n${da}\n${db}`) :
      ret(db)) :
    call(s(l, r.rhs), db =>
    typeof db === "string" ? ret(da) :
    ret(disjoin_inequalities(da, db)))) :
  l.kind === unk ? ret(`\`${print_type(l)}\` does not subsume \`${print_type(r)}\`.`) :
  r.kind === any ? ret(`\`${print_type(l)}\` does not subsume \`${print_type(r)}\`.`) :
  l.kind === lit && (
    r.kind === lit && l.value === r.value ||
    typeof l.value === "number" && r.kind === num ||
    typeof l.value === "string" && r.kind === str ||
    typeof l.value === "boolean" && r.kind === bol) ? ret(empty_inequalities()) :
  l.kind === ext && r.kind === ext ?
    call(s(l.operand, r.operand), dx =>
    typeof dx === "string" ? ret(`\`${print_type(l)}\` does not subsume \`${print_type(r)}\`.\n${dx}`) :
    ret(dx)) :
  l.kind === iov && r.kind === iov ?
    call(s(l.operand, r.operand), dx =>
    typeof dx === "string" ? ret(`\`${print_type(l)}\` does not subsume \`${print_type(r)}\`.\n${dx}`) :
    ret(dx)) :
  l.kind === rec ?
    r.kind === rec ? jmp(p(l.elements, r.elements, Object.keys(r.elements))) :
    ret(`\`${print_type(l)}\` does not subsume \`${print_type(r)}\`.`) :
  r.kind === abs ?
    di(result(l, r.lhs), dr =>
    typeof dr === "string" ? ret(`\`${print_type(l)}\` does not subsume \`${print_type(r)}\`.\n${dr}`) :
    call(s(dr[0], r.rhs), dy =>
    typeof dy === "string" ? ret(`\`${print_type(l)}\` does not subsume \`${print_type(r)}\`.\n${dy}`) : (
    ret(conjoin_inequalities(dy, dr[1]))))) :
  ret(`\`${print_type(l)}\` does not subsume \`${print_type(r)}\`.`)
return s(l, r) })
if (typeof o === "string") return o;
// console.log(`\`${print_type(l)}\` subsumes\`${print_type(r)}\` with constraints \`${print_type_map(o)}\`.`)
return o }

