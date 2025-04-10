import { TextPosition } from "./read.js"

export type Prop =
  { kind: "all", id: string, body: Prop } |
  { kind: "exs", id: string, body: Prop } |
  { kind: "imp", lhs: Prop, rhs: Prop } |
  { kind: "app", lhs: Prop, rhs: Prop } |
  { kind: "ref", id: string }

export type ProofStep =
  { where: TextPosition } & (
  { kind: "intro", ids: Prop[] } |
  { kind: "use", prop: Prop } |
  { kind: "push", hyp: Prop, ops: Prop[] } |
  { kind: "with", hyp: Prop } |
  { kind: "apply", hyp: Prop, ops: Prop[] } |
  { kind: "sorry" })

export type Proof = ProofStep[]

export type Scope = { props: string[], proofs: [Prop, string[], Prop][] }
export type Goal = { scope: Scope, prop: Prop }

export type Goals = Goal[]

export type Kind = Prop['kind']
export type Sorts = { [i in Kind]: Prop & { kind: i } }

export type Statement =
  { where: TextPosition } & (
  { kind: "declare", ids: string[] } |
  { kind: "axiom", name: Prop, scheme: string[], prop: Prop } |
  { kind: "theorem", name: Prop, scheme: string[], prop: Prop, proof: Proof })

export type Article = Statement[]

type Visit = <K extends Kind, R>(o: { [i in K]: (e: Sorts[i]) => R }) => (e: Sorts[K]) => R
export const visit: Visit = o => e => o[e.kind as keyof typeof o](e)

export const all = (id: string, body: Prop): Prop => ({ kind: "all", id, body })
export const exs = (id: string, body: Prop): Prop => ({ kind: "exs", id, body })
export const imp = (lhs: Prop, rhs: Prop): Prop => ({ kind: "imp", lhs, rhs })
export const app = (lhs: Prop, rhs: Prop): Prop => ({ kind: "app", lhs, rhs })
export const ref = (id: string): Prop => ({ kind: "ref", id })