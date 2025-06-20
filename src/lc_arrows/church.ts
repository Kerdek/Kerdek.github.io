export type Term =
  { kind: "app", lhs: Term, rhs: Term } |
  { kind: "abs", id: string, body: Term } |
  { kind: "imp", lhs: Term, rhs: Term } |
  { kind: "ref", id: string }

export type Scope = { [i: string]: Term }
export type Kind = Term['kind']
export type Sorts = { [i in Kind]: Term & { kind: i } }

type Visit = <K extends Kind, R>(o: { [i in K]: (e: Sorts[i]) => R }) => (e: Sorts[K]) => R
export const visit: Visit = o => e => o[e.kind as keyof typeof o](e)

export const app = (lhs: Term, rhs: Term): Term => ({ kind: "app", lhs, rhs })
export const abs = (id: string, body: Term): Term => ({ kind: "abs", id, body })
export const imp = (lhs: Term, rhs: Term): Term => ({ kind: "imp", lhs, rhs })
export const ref = (id: string): Term => ({ kind: "ref", id })