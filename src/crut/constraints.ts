import { typ_cnj, typ_dsj, TypeMap, TypeTree } from "./graph.js"
import { print_inequalities } from "./print.js"
import { substitute } from "./substitute.js"

export type Inequalities = { less: TypeMap, greater: TypeMap }

export const empty_inequalities = () => ({ less: {}, greater: {} })

export const apply_inequalities: (l: Inequalities, r: Inequalities) => Inequalities = (l, r) => {
const o: Inequalities = { less: {}, greater: {} }
for (const k in l.less) {
  o.less[k] = substitute(r, l.less[k] as TypeTree, true) }
for (const k in l.greater) {
  o.greater[k] = substitute(r, l.greater[k] as TypeTree, false) }
console.log(`Applied \`${print_inequalities(r)}\` to \`${print_inequalities(l)}\` to get \`${print_inequalities(o)}\`.`)
return o }

export const conjoin_inequalities: (l: Inequalities, r: Inequalities) => Inequalities = (l, r) => {
const o = { less: { ...l.less }, greater: { ...l.greater } }
for (const k in r.less) {
  if (k in o.less) {
    o.less[k] = typ_cnj(r.less[k] as TypeTree, o.less[k] as TypeTree) }
  else {
    o.less[k] = r.less[k] as TypeTree } }
for (const k in r.greater) {
  if (k in o.greater) {
    o.greater[k] = typ_cnj(r.greater[k] as TypeTree, o.greater[k] as TypeTree) }
  else {
    o.greater[k] = r.greater[k] as TypeTree } }
return o }

export const disjoin_inequalities: (l: Inequalities, r: Inequalities) => Inequalities = (l, r) => {
const o = { less: { ...l.less }, greater: { ...l.greater } }
for (const k in r.less) {
  if (k in o.less) {
    o.less[k] = typ_dsj(r.less[k] as TypeTree, o.less[k] as TypeTree) }
  else {
    o.less[k] = r.less[k] as TypeTree } }
for (const k in r.greater) {
  if (k in o.greater) {
    o.greater[k] = typ_dsj(r.greater[k] as TypeTree, o.greater[k] as TypeTree) }
  else {
    o.greater[k] = r.greater[k] as TypeTree } }
return o }
