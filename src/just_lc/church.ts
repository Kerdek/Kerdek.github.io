// syntax node types
export type App = { kind: "app", lhs: Graph, rhs: Graph }
export type Abs = { kind: "abs", param: string, body: Graph }
export type Ref = { kind: "ref", id: string }

// runtime node type
export type Shr = { kind: "shr", body: Graph, value?: Graph }

export type Graph = Ref | App | Abs | Shr
export type Kind = Graph['kind'];

export type Sorts = { [i in Kind]: Graph & { kind: i } }

type Visit = <K extends Kind, R>(o: { [i in K]: (e: Sorts[i]) => R }) => (e: Sorts[K]) => R

export const visit: Visit = o => e => o[e.kind](e)