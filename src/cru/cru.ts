import { STAMStem } from '../stam.js'

export type App = ["app", Graph, Graph]
export type Abs = ["abs", string, Graph]
export type Var = ["var", string]
export type Lit = ["lit", Value]
export type Rec = ["rec", RecordSyntax]
export type Lst = ["lst", ListSyntax]
export type Acs = ["acs", Graph, Graph]
export type Mod = ["mod", Module, Graph]
export type Shr = ["shr", Graph, Value?]
export type Elm = ["elm", string[], Graph]

export type Graph = Abs | Lit | Shr | App | Var | Mod | Acs | Rec | Lst | Elm

export type Kind = Graph[0]

export type EvaluateBranch = STAMStem<Graph, Value>
export type Func = (e: Graph) => EvaluateBranch
export type Value = string | number | boolean | null | undefined | void | Record | List | Func
export type RecordSyntax = ([false, Graph, Graph] | [true, Graph])[]
export type ListSyntax = [boolean, Graph][]
export type List = Shr[]
export type Record = { [i: string]: Shr }
export type Builtins = { [i: string]: Value }
export type Definition = [string, Graph]
export type Module = Definition[]
export type Print = (e: Graph) => string
export type Evaluate = (e: Graph) => Value

type Sorts = { [i in Kind]: [i, ...Rest<i, Graph>] }
type Rest<i, Graph> = Graph extends [i, ...infer R] ? R : never

type Make = <K extends Graph>(...x: K) => K
type Visit = <K extends Kind, R, A extends any[]>(o: { [i in K]: (e: Sorts[i], ...a: A) => R }) => (e: Sorts[K], ...a: A) => R
type Assign = <K extends Graph>(e: Graph, x: K) => K

export const make: Make = (...x) => x
export const visit: Visit = o => (e, ...a) => (f => f(e, ...a))(o[e[0]])

export const assign: Assign = (e, x) => {
  let i = 0
  for (; i < x.length; i++) {
    e[i] = x[i] as any }
  for (; i < e.length; i++) {
    delete e[i] }
  return e as any }

