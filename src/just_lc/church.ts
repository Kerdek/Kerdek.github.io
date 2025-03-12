import { STAMStem } from '../stam.js'

// syntax node types
export type App = { kind: "app", lhs: Graph, rhs: Graph }
export type Abs = { kind: "abs", param: string, body: Graph }
export type Ref = { kind: "ref", id: string }

// runtime node type
export type Shr = { kind: "shr", body: Graph, value?: Graph }
export type Lit = { kind: "lit", val: Value }

export type Graph = Ref | App | Abs | Ref | Shr | Lit
export type Kind = Graph['kind'];

export type Func = (e: Graph) => Graph
export type Value = number | string | boolean | Func
export type Record = { [i: string]: Shr }
export type Sorts = { [i in Kind]: Graph & { kind: i } }

type Visit = <K extends Kind, R>(o: { [i in K]: (e: Sorts[i]) => R }) => (e: Sorts[K]) => R
type Assign = <K extends { [i: string]: any }>(e: { [i: string]: any }, x: K) => K

export const visit: Visit = o => e => o[e.kind](e)
export const assign: Assign = (e, x) => {
  if (x === e) {
    return e as any }
  for (const i in e) {
    delete e[i] }
  for (const i in x) {
    e[i] = x[i] as any }
  return e as any }
