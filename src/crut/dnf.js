// import { immediately_subsumes } from "./constraints.js";
// import { di } from "./di.js";
// import { abs, any, bol, cnj, dsj, iov, lit, Literal, num, rec, ref, str, typ_abs, typ_any, typ_bol, typ_cnj, typ_dsj, typ_iov, typ_lit, typ_num, typ_rec, typ_ref, typ_str, typ_unk, TypeMap, unk, visit_type, TypeTree } from "./graph.js";
// import { print_type } from "./print.js";
// import { homproc, jmp, Process } from "./run.js";
// import { subsume_dnf } from "./subsume.js";
export {};
// export type TypeDNFFunction = [string[], TypeDNF, TypeDNF]
// export type TypeDNF = TypeDNFElement[]
// export type TypeDNFElement =
// { refs: string[] } & (
//   { kind: typeof any } |
//   { kind: typeof unk } |
//   { kind: typeof num } |
//   { kind: typeof str } |
//   { kind: typeof bol } |
//   { kind: typeof lit, literal: Literal } |
//   { kind: typeof iov, io: TypeDNF } |
//   { kind: typeof abs, functions: TypeDNFFunction[] } |
//   { kind: typeof rec, elements: { [i: string]: TypeDNF }})
// export const dnf_new  = (() => {
// let n = 0
// return () => (dnf_refs([`__${n++}`])) })()
// export const dnf_lit = (literal: Literal): TypeDNF => [{ kind: lit, refs: [], literal }]
// export const dnf_unk = (): TypeDNF => [{ kind: unk, refs: [] }]
// export const dnf_refs = (refs: string[]): TypeDNF => [{ kind: unk, refs }]
// export const dnf_num = (): TypeDNF => [{ kind: num, refs: [] }]
// export const dnf_str = (): TypeDNF => [{ kind: str, refs: [] }]
// export const dnf_bol = (): TypeDNF => [{ kind: bol, refs: [] }]
// export const dnf_abs = (functions: TypeDNFFunction[]): TypeDNF => [{ kind: abs, refs: [], functions }]
// const conjoin_refs: (l: string[], r: string[]) => string[] = (l, r) => [...new Set([...l, ...r])]
// const conjoin_push_function: (o: TypeDNFFunction[], e: TypeDNFFunction) => void = (o, e) => {
// for (const i in o) {
//   if (immediately_subsumes(subsume_dnf(dnf_abs([e]), dnf_abs([o[i] as TypeDNFFunction])))) {
//     return }
//   if (immediately_subsumes(subsume_dnf(dnf_abs([o[i] as TypeDNFFunction]), dnf_abs([e])))) {
//     o[i] = e
//     return } }
// o.push(e) }
// const conjoin_functions: (l: TypeDNFFunction[], r: TypeDNFFunction[]) => TypeDNFFunction[] = (l, r) => {
// const o: TypeDNFFunction[] = []
// for (const ll of l) {
//   conjoin_push_function(o, ll) }
// for (const rr of r) {
//   conjoin_push_function(o, rr) }
// return o }
// const conjoin_record: (l: { [i: string]: TypeDNF }, r: { [i: string]: TypeDNF }) => { [i: string]: TypeDNF } | string = (l, r) => {
// const o: { [i: string]: TypeDNF } = {}
// const n = [...new Set([...Object.keys(l), ...Object.keys(r)])]
// for (const i of n) {
//   const ll = l[i], rr = r[i]
//   if (ll && rr) {
//     const z = conjoin_dnf(ll, rr)
//     if (typeof z === "string") {
//       return z }
//     o[i] = z }
//   else {
//     o[i] = ll || rr as TypeDNF } }
// return o }
// const conjoin_type_element: (l: TypeDNFElement, r: TypeDNFElement) => TypeDNFElement | string = (l, r) => {
// const no_intersection = (m: string) => `No intersection between ${print_type(dnf_to_tree([l]))} and ${print_type(dnf_to_tree([r]))}.\n${m}`
// return (
//   l.kind === any || r.kind === any ? { kind: any, refs: conjoin_refs(l.refs, r.refs) } :
//   l.kind === unk ? { ...r, refs: conjoin_refs(l.refs, r.refs) } :
//   r.kind === unk ? { ...l, refs: conjoin_refs(l.refs, r.refs) } :
//   l.kind === num && r.kind === num ? { kind: num, refs: conjoin_refs(l.refs, r.refs) } :
//   l.kind === str && r.kind === str ? { kind: str, refs: conjoin_refs(l.refs, r.refs) } :
//   l.kind === bol && r.kind === bol ? { kind: bol, refs: conjoin_refs(l.refs, r.refs) } :
//   l.kind === lit && r.kind === lit ? l.literal !== r.literal ? no_intersection(`The literal types are unequal.`) : { kind: lit, refs: conjoin_refs(l.refs, r.refs), literal: l.literal } :
//   l.kind === iov && r.kind === iov ? di(conjoin_dnf(l.io, r.io), io => typeof io === "string" ? no_intersection(io) : { kind: iov, refs: conjoin_refs(l.refs, r.refs), io }) :
//   l.kind === abs && r.kind === abs ? { kind: abs, refs: conjoin_refs(l.refs, r.refs), functions: conjoin_functions(l.functions, r.functions) } :
//   l.kind === rec && r.kind === rec ? di(conjoin_record(l.elements, r.elements), elements => typeof elements === "string" ? no_intersection(elements) : { kind: rec, refs: conjoin_refs(l.refs, r.refs), elements }) :
//   no_intersection('The types are unrelated.')) }
// export const disjoin_push_type_element: (o: TypeDNF, e: TypeDNFElement) => void = (o, e) => {
// for (const i in o) {
//   if (immediately_subsumes(subsume_dnf([e], [o[i] as TypeDNFElement]))) {
//     o[i] = e
//     return }
//   if (immediately_subsumes(subsume_dnf([o[i] as TypeDNFElement], [e]))) {
//     return } }
// o.push(e) }
// export const conjoin_dnf: (l: TypeDNF, r: TypeDNF) => TypeDNF | string = (l, r) => {
// const o: TypeDNF = []
// for (const a of l) {
//   for (const b of r) {
//     const z = conjoin_type_element(a, b)
//     if (typeof z === "string") {
//       return z }
//     disjoin_push_type_element(o, z) } }
// return o }
// export const disjoin_dnf: (l: TypeDNF, r: TypeDNF) => TypeDNF = (l, r) => {
// const o: TypeDNF = []
// for (const a of l) {
//   disjoin_push_type_element(o, a) }
// for (const b of r) {
//   disjoin_push_type_element(o, b) }
// return o }
// export const unique_dnf: (t: TypeDNF) => TypeDNF = t => {
// const o: TypeDNF = []
// t.forEach(e => disjoin_push_type_element(o, e))
// return o }
// export const add_refs: (refs: string[], t: TypeTree) => TypeTree = (refs, t) => {
// for (const ref of refs) {
//   t = typ_cnj(t, typ_ref(ref)) }
// return t }
// export const just_refs: (refs: string[], t: TypeTree) => TypeTree = (refs, t) => {
// let add_conj: (tp: TypeTree) => void = tp => {
//   t = tp
//   add_conj = tp => {
//     t = typ_cnj(t, tp) } }
// for (const ref of refs) {
//   add_conj(typ_ref(ref)) }
// return t }
// export const type_element_to_tree: (a: TypeDNFElement) => TypeTree = a => {
// if (a.kind === any) { return add_refs(a.refs, typ_any()) }
// if (a.kind === unk) { return just_refs(a.refs, typ_unk()) }
// if (a.kind === num) { return add_refs(a.refs, typ_num()) }
// if (a.kind === str) { return add_refs(a.refs, typ_str()) }
// if (a.kind === bol) { return add_refs(a.refs, typ_bol()) }
// if (a.kind === lit) { return add_refs(a.refs, typ_lit(a.literal)) }
// if (a.kind === iov) { return add_refs(a.refs, typ_iov(dnf_to_tree(a.io))) }
// if (a.kind === abs) {
//   let tr: TypeTree = typ_unk()
//   let add_conj: (t: TypeTree) => void = t => {
//     tr = t
//     add_conj = t => {
//       tr = typ_cnj(tr, t) } }
//   for (const l of a.functions) {
//     add_conj(typ_abs(l[0], dnf_to_tree(l[1]), dnf_to_tree(l[2]))) }
//   return add_refs(a.refs, tr) }
// if (a.kind === rec) { return di(a.elements, o => add_refs(a.refs, typ_rec(Object.fromEntries(Object.keys(o).map(k => [k, dnf_to_tree(o[k] as TypeDNF)]))))) }
// return a }
// export const dnf_to_tree: (a: TypeDNF) => TypeTree = a => {
// let tr: TypeTree = typ_any()
// let add_disj: (t: TypeTree) => void = t => {
//   tr = t
//   add_disj = t => {
//     tr = typ_dsj(tr, t) } }
// for (const x of a) {
//   add_disj(type_element_to_tree(x)) }
// return tr }
// export const tree_to_dnf: (t: TypeTree) => TypeDNF | string = t => homproc((call, ret) => {
// const q: (t: TypeMap, k: string[], r: { [i: string]: TypeDNF }) => Process = (t, k, r) => () =>
// !k[0] ? ret([{ kind: rec, refs: [], elements: r }]) :
// di(k[0], i =>
// call(s(t[i] as TypeTree), dx =>
// typeof dx === "string" ? ret(dx) :
// jmp(q(t, k.slice(1), { ...r, [i]: dx }))))
// const s: (t: TypeTree) => Process = visit_type({
// [ref]: e => ret([{ kind: unk, refs: [e.name] }]),
// [abs]: e =>
//   call(s(e.lhs), dx =>
//   typeof dx === "string" ? ret(dx) :
//   call(s(e.rhs), dy =>
//   typeof dy === "string" ? ret(dy) :
//   ret([{ kind: abs, refs: [], functions: [[e.vars, dx, dy]] }]))),
// [num]: () => ret([{ kind: num, refs: [] }]),
// [str]: () => ret([{ kind: str, refs: [] }]),
// [bol]: () => ret([{ kind: bol, refs: [] }]),
// [lit]: e => ret([{ kind: lit, refs: [], literal: e.value}]),
// [unk]: () => ret([{ kind: unk, refs: [] }]),
// [any]: () => ret([]),
// [iov]: e =>
//   call(s(e.operand), dx =>
//   typeof dx === "string" ? ret(dx) :
//   ret([{ kind: iov, refs: [], io: dx }])),
// [rec]: e => jmp(q(e.elements, Object.keys(e.elements), {})),
// // [aka]: e => jmp(s(e.identity)),
// [dsj]: e =>
//   call(s(e.lhs), dx =>
//   typeof dx === "string" ?
//     call(s(e.rhs), dy =>
//     typeof dy === "string" ? ret(`${dx}\n${dy}`) :
//     ret(dy)) :
//   call(s(e.rhs), dy =>
//   typeof dy === "string" ? ret(dx) :
//   ret(disjoin_dnf(dx, dy)))),
// [cnj]: e =>
//   call(s(e.lhs), dx =>
//   typeof dx === "string" ? ret(dx) :
//   call(s(e.rhs), dy =>
//   typeof dy === "string" ? ret(dy) :
//   ret(conjoin_dnf(dx, dy))))})
// return s(t) })
//# sourceMappingURL=dnf.js.map