const enumerate = <T extends object>(o: T):[keyof T, T[keyof T]][] =>
(Reflect.ownKeys(o) as (keyof T)[]).map(i => [i, o[i] as T[keyof T]]);

type _Narrow<T, U> = [U] extends [T] ? U : Extract<T, U>
export type Narrow<T = unknown> =
| _Narrow<T, 0 | number & {}>
| _Narrow<T, 0n | bigint & {}>
| _Narrow<T, "" | string & {}>
| _Narrow<T, boolean>
| _Narrow<T, symbol>
| _Narrow<T, []>
| _Narrow<T, { [_: PropertyKey]: Narrow }>
| (T extends object ? { [K in keyof T]: Narrow<T[K]> } : never)
| Extract<{} | null | undefined, T>

const narrow = <U>(x: Narrow<U>): Narrow<U> => x

const fields = (() => {
  return narrow({
  ext: ['name', 'body'],
  mem: ['body'],
  nym: ['sym', 'body'],
  uni: ['sym', 'body'],
  ref: ['sym'],
  app: ['lhs', 'rhs'],
  rec: [],
  lit: ['val'] }) })()

type IData = {
  ext: [Nym, Graph],
  mem: [[Graph]],
  uni: [Identifier, Graph]
  ref: [Identifier]
  app: [Graph, Graph],
  rec: [],
  lit: [string | number | boolean] }

type Fields = typeof fields
export type TermKind = keyof Fields & keyof IData

type Data = { [K in TermKind]: (
  Fields[K] extends [any, any] ? [
    IData[K][0],
    IData[K][1]] :
  Fields[K] extends [any] ? [
    IData[K][0]] :
  Fields[K] extends [] ? [] :
  never) }

export type Nym = { sym: Identifier, body: [Graph] }
export type Term = { [K in TermKind]: { kind: K } & (
  Fields[K] extends [string, string] ? { [c in 0 | 1 as Fields[K][c]]: Data[K][c] } :
  Fields[K] extends [string] ? { [c in 0 as Fields[K][c]]: Data[K][c] } :
  Fields[K] extends [] ? { [c in never as Fields[K][c]]: Data[K][c] } :
  never)}

export type Graph = Term[TermKind]
export type Normal = Term["lit" | "ref" | "rec" | "uni"]
export type Binary = Graph & { lhs: Term[TermKind], rhs: Term[TermKind] }
export type Unary = Graph & { body: Term[TermKind] }
export type Identifier = string
export type Vars = { [i: string]: Graph }
export type VarsN = { [i: string]: number }

type Morphism<K extends TermKind> = (a: Term[K]) => Graph
type PMorphism<K extends TermKind> = (a: Term[K]) => Graph | null
type EMorphism = (e: Graph) => null
type Tbl = <K extends TermKind, F>(o: { [k in K]: (e: Term[k]) => F }) => (e: Term[K]) => F
type Make = <K extends TermKind>(kind: K, ...data: Data[K]) => Term[K]
type Reassign = <T extends Graph, U extends Graph>(e: T, r: U) => U
type Redirect = <T extends Graph, U extends Graph>(e: T, r: [U]) => U

export type NullaryKind = 'rec'
export type BinaryKind = 'app'

export const tbl: Tbl = o => e => o[e.kind](e)
export const make: Make = (kind, ...data) => ({ kind, ...Object.fromEntries(data.map((e, i) => [fields[kind][i], e])) })

const reassign: Reassign =
(e, r) => {
  enumerate(e).forEach(([i]) => delete e[i])
  Object.assign(e, r)
  return e as unknown as typeof r }

const redirect: Redirect =
(e, r) => {
  enumerate(e).forEach(([i]) => delete e[i])
  Object.assign(e, make('mem', r))
  return r[0] }

export const reduce: PMorphism<TermKind> = (() => {

const apply: (e: { kind: "app", lhs: Normal, rhs: Graph }) => Graph =
e => tbl({
  uni: lhs => reassign(e, make('ext', { sym: lhs.sym, body: [e.rhs] }, lhs.body)) as Graph,
  rec: () => {
    e.lhs = e.rhs as Normal
    e.rhs = e
    return e },
  lit: () => { throw new Error("Invalid application of literal.") },
  ref: () => { throw new Error("Invalid application of reference.") } })(e.lhs)

const reduce_app: PMorphism<'app'> =
e => {
  const l = reduce(e.lhs)
  if (!l) return apply(e as { kind: "app", lhs: Normal, rhs: Graph })
  e.lhs = l
  return e }

const reduce_mem: PMorphism<'mem'> =
e => e.body[0]

const reduce_ext: PMorphism<'ext'> =
e => {
  const re: Morphism<TermKind> = a => make('ext', e.name, a)
  const nullary: Morphism<TermKind> = b => redirect(e, [b])
  const binary_dist: (k: TermKind) => (b: Binary) => Graph = k => b => {
    while (b.lhs.kind === 'mem') {
      b.lhs = b.lhs.body[0] }
    while (b.rhs.kind === 'mem') {
      b.rhs = b.rhs.body[0] }
    return reassign(e, make(k, re(b.lhs), re(b.rhs))) }
  const table = tbl({
    mem: body => {
      e.body = body.body[0]
      return e.body },
    ext: body => (b => {
      if (b) {
        e.body = b }
      return e})(reduce_ext(body)),
    uni: body => e.name.sym === body.sym ?
      redirect(e, [body]) :
      reassign(e, make('uni', body.sym, make('ext', e.name, body.body))),
    rec: nullary,
    ref: body => e.name.sym === body.sym ?
      redirect(e, e.name.body) :
      reassign(e, body), // existential disappears
    lit: b => redirect(e, [b]),
    app: binary_dist('app') })
  return table(e.body) }

const normal: EMorphism = () => null

return tbl({
  app: reduce_app,
  ext: reduce_ext,
  mem: reduce_mem,
  ref: e => { throw new Error(`Undefined reference to ${e.sym}`)},
  uni: normal, rec: normal, lit: normal }) })()

export type Evaluate = Morphism<TermKind>
export const evaluate: Evaluate =
e => {
  for (;;) {
    const ep = reduce(e)
    if (!ep) return e
    e = ep } }
