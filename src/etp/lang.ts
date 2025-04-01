export type Prop =
  { kind: "all", id: string, schema: boolean, body: Prop } |
  { kind: "imp", lhs: Prop, rhs: Prop } |
  { kind: "app", lhs: Prop, rhs: Prop } |
  { kind: "ref", id: string }

export type ProofStep =
  { kind: "intro", ids: string[] } |
  { kind: "apply", hyp: string, ops: Prop[] } |
  { kind: "sorry" }

export type Proof = ProofStep[]

export type Scope = { props: Set<string>, proofs: { [i: string]: Prop } }
export type Goal = { scope: Scope, prop: Prop }

export type Goals = Goal[]

export type Article = { [i: string]: [Prop, Proof] }

export type Kind = Prop['kind']
export type Sorts = { [i in Kind]: Prop & { kind: i } }

type Visit = <K extends Kind, R>(o: { [i in K]: (e: Sorts[i]) => R }) => (e: Sorts[K]) => R
export const visit: Visit = o => e => o[e.kind as keyof typeof o](e)

export const all = (id: string, schema: boolean, body: Prop): Prop => ({ kind: "all", id, schema, body })
export const imp = (lhs: Prop, rhs: Prop): Prop => ({ kind: "imp", lhs, rhs })
export const app = (lhs: Prop, rhs: Prop): Prop => ({ kind: "app", lhs, rhs })
export const ref = (id: string): Prop => ({ kind: "ref", id })