import { STAMStem } from '../stam.js'

// syntax node types
export type App = { kind: "app", lhs: Graph, rhs: Graph }
export type Abs = { kind: "abs", param: string, body: Graph }
export type Ref = { kind: "ref", id: string }
export type Lit = { kind: "lit", value: Value }

// runtime node types
export type Ext = { kind: "ext", defs: Record, body: Graph }
export type Shr = { kind: "shr", body: Graph, value?: Value }

export type Graph = Ref | Lit | App | Abs | Ref | Shr | Ext
export type Kind = Graph['kind'];

export type EvaluateBranch = STAMStem<[Graph, Record], Value>
export type Func = (e: Graph) => EvaluateBranch
export type Value = number | string | boolean | Func
export type Record = { [i: string]: Shr }
export type Sorts = { [i in Kind]: Graph & { kind: i } }

type Visit = <K extends Kind, R, A extends any[]>(o: { [i in K]: (e: Sorts[i], ...a: A) => R }) => (e: Sorts[K], ...a: A) => R
type Assign = <K extends { [i: string]: any }>(e: { [i: string]: any }, x: K) => K

export const visit: Visit = o => (e, ...a) => (f => f(e, ...a))(o[e.kind])
export const assign: Assign = (e, x) => {
  if (x === e) {
    return e as any }
  for (const i in e) {
    delete e[i] }
  for (const i in x) {
    e[i] = x[i] as any }
  return e as any }
