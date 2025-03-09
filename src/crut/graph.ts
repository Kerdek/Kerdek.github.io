import { Inequalities } from './constraints.js'
import { Branch, Process } from './run.js'
import { Pos } from './scanner.js'

export const ext = Symbol('ext')
export const cst = Symbol('cst')
export const unk = Symbol('unk')
export const any = Symbol('any')
export const num = Symbol('num')
export const str = Symbol('str')
export const bol = Symbol('bol')
export const res = Symbol('res')
export const rec = Symbol('rec')
export const cnj = Symbol('cnj')
export const dsj = Symbol('dsj')
export const app = Symbol('app')
export const abs = Symbol('abs')
export const ref = Symbol('ref')
export const sav = Symbol('sav')
export const aka = Symbol('aka')
export const iov = Symbol('iov')
export const lit = Symbol('lit')
export const acs = Symbol('acs')
export const mod = Symbol('mod')
export const blt = Symbol('blt')

export type TExt = { kind: typeof ext, operand: TypeTree }
export type TIov = { kind: typeof iov, operand: TypeTree }
export type TAka = { kind: typeof aka, name: string, identity: TypeTree }
export type TUnk = { kind: typeof unk }
export type TAny = { kind: typeof any }
export type TRef = { kind: typeof ref, name: string }
export type TAbs = { kind: typeof abs, vars: [string, boolean][], lhs: TypeTree, rhs: TypeTree }
export type TNum = { kind: typeof num }
export type TStr = { kind: typeof str }
export type TBol = { kind: typeof bol }
export type TLit = { kind: typeof lit, value: Literal }
export type TRec = { kind: typeof rec, elements: TypeMap }
export type TCnj = { kind: typeof cnj, lhs: TypeTree, rhs: TypeTree }
export type TDsj = { kind: typeof dsj, lhs: TypeTree, rhs: TypeTree }

export type App = { kind: typeof app, location: Pos, lhs: Graph, rhs: Graph }
export type Abs = { kind: typeof abs, location: Pos, parameter: string, body: Graph }
export type Ref = { kind: typeof ref, location: Pos, name: string }
export type Sav = { kind: typeof sav, record: Record, body: Graph }
export type Aka = { kind: typeof aka, name:string, identity: Ptr }
export type Ext = { kind: typeof ext, value: [[TypeTree]] }
export type Iov = { kind: typeof iov, iokind: string, operands: Graph[] }
export type Lit = { kind: typeof lit, value: Literal }
export type Cst = { kind: typeof cst, location: Pos, destination: TypeTree, body: Graph }
export type Res = { kind: typeof res, elements: RecordSyntax }
export type Rec = { kind: typeof rec, elements: Record }
export type Acs = { kind: typeof acs, location: Pos, lhs: Graph, rhs: Graph }
export type Mod = { kind: typeof mod, module: Module, body: Graph }
export type Blt = { kind: typeof blt, code: Code }

export type TypeTree =
  TRef | TAbs | TNum | TStr | TBol | TDsj | TCnj |
  TUnk | TAny | TIov | TAka | TLit | TRec | TExt

export type Normal = Abs | Lit | Blt | Iov | Rec | Ext
export type Term = Normal | Aka | App | Ref | Mod | Acs | Rec | Res | Cst
export type Graph = Term | Sav

export type TypeKind = TypeTree['kind']
export type GraphKind = Graph['kind']

export type VisitBranch = <K extends GraphKind>(o: { [i in K]: (e: GraphSorts[i]) => Branch }) => <I extends K>(e: GraphSorts[I]) => Process
export type VisitBranchT = <K extends TypeKind>(o: { [i in K]: (e: TypeSorts[i]) => Branch }) => <I extends K>(e: TypeSorts[I]) => Process

export type Ptr = [Graph]
export type Record = { [i: string]: Ptr }
export type TypeMap = { [i: string]: TypeTree }
export type Tuple = Ptr[]
export type RecordSyntaxElement = [false, string, Graph] | [true, Graph]
export type RecordSyntax = RecordSyntaxElement[]
export type Literal = string | number | boolean | undefined
export type Module = Definition[]
export type Definition = [string, Graph, TypeTree | null, Pos]
export type Code = (r: Graph) => EvaluateProcess
export type TypingContext = { [i: string]: null | ((
  call: (u: Process, v: (x: [TypeTree, Inequalities] | string) => Branch) => Branch,
  ret: (x: [TypeTree, Inequalities] | string) => Branch) => Process) }

type TypeSorts = { [i in TypeKind]: TypeTree & { kind: i } }
type GraphSorts = { [i in GraphKind]: Graph & { kind: i } }

type EvaluateProcess = (
  call: (u: Process, v: (x: Normal) => Branch) => Branch,
  ret: (x: Normal) => Branch) => Process

export const visit_graph: VisitBranch = o => e => (f => () => f(e))(o[e.kind as keyof typeof o])
export const visit_type: VisitBranchT = o => e => (f => () => f(e))(o[e.kind as keyof typeof o])

export const typ_new: () => TRef = (() => {
let n = 0
return () => (typ_ref(`__${n++}`)) })()

export const typ_num: () => TNum = () => ({ kind: num })
export const typ_str: () => TStr = () => ({ kind: str })
export const typ_bol: () => TBol = () => ({ kind: bol })
export const typ_unk: () => TUnk = () => ({ kind: unk })
export const typ_any: () => TAny = () => ({ kind: any })
export const typ_lit: (value: Literal) => TLit = value => ({ kind: lit, value })
export const typ_rec: (elements: TypeMap) => TRec = elements => ({ kind: rec, elements })
export const typ_ref: (name: string) => TRef = name => ({ kind: ref, name })
export const typ_ext: (operand: TypeTree) => TExt = operand => ({ kind: ext, operand })
export const typ_iov: (operand: TypeTree) => TIov = operand => ({ kind: iov, operand })
export const typ_aka: (name: string, identity: TypeTree) => TAka = (name, identity) => ({ kind: aka, name, identity })
export const typ_abs: (vars: [string, boolean][], lhs: TypeTree, rhs: TypeTree) => TAbs = (vars, lhs, rhs) => ({ kind: abs, vars, lhs, rhs })
export const typ_cnj: (lhs: TypeTree, rhs: TypeTree) => TCnj = (lhs, rhs) => ({ kind: cnj, lhs, rhs })
export const typ_dsj: (lhs: TypeTree, rhs: TypeTree) => TDsj = (lhs, rhs) => ({ kind: dsj, lhs, rhs })

export const term_lit: (value: Literal) => Lit = value => ({ kind: lit, value })
export const term_ref: (location: Pos, name: string) => Ref = (location, name) => ({ kind: ref, location, name })
export const term_mod: (definitions: Module, body: Graph) => Mod = (module, body) => ({ kind: mod, module, body })
export const term_cst: (location: Pos, destination: TypeTree, body: Graph) => Cst = (location, destination, body) => ({ kind: cst, location, destination, body })
export const term_res: (elements: RecordSyntax) => Res = elements => ({ kind: res, elements })
export const term_rec: (elements: Record) => Rec = elements => ({ kind: rec, elements })
export const term_acs: (location: Pos, lhs: Graph, rhs: Graph) => Acs = (location, lhs, rhs) => ({ kind: acs, location, lhs, rhs })
export const term_app: (location: Pos, lhs: Graph, rhs: Graph) => App = (location, lhs, rhs) => ({ kind: app, location, lhs, rhs })
export const term_abs: (location: Pos, parameter: string, body: Graph) => Abs = (location, parameter, body) => ({ kind: abs, location, parameter, body })
export const term_blt: (code: Code) => Blt = code => ({ kind: blt, code })
export const term_ext: (value: [[TypeTree]]) => Ext = value => ({ kind: ext, value })
export const term_iov: (iokind: string, operands: Graph[]) => Iov = (iokind, operands) => ({ kind: iov, iokind, operands })
export const term_aka: (identity: Ptr, name: string) => Aka = (identity, name) => ({ kind: aka, name, identity })
export const term_sav: (record: Record, body: Graph) => Sav = (record, body) => ({ kind: sav, record, body })
