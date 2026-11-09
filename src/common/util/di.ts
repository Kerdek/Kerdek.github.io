export type Options<T extends {}> = { [I in keyof T]?: T[I] }
export type VisitDefault = <G extends { [K in string]: { k: K }}>() => <R, K extends keyof G, D extends (e: G[keyof G], ...r: E) => R, E extends any[], O extends { [i in keyof G]: i extends K ? (e: G[Extract<keyof G, i>], ...r: E) => R : undefined }>(d: D, o: { [i in K]: O[i] }) => (e: G[keyof G], ...r: E) => R
export type Visit<G extends { [K in string]: { k: K }}> = <R, E extends any[]>(o: { [i in keyof G]: (e: G[i], ...r: E) => R }) => (e: G[keyof G], ...r: E) => R
export type VisitG = <G extends { [K in string]: { k: K }}, R, E extends any[]>(o: { [i in keyof G]: (e: G[i], ...r: E) => R }) => (e: G[keyof G], ...r: E) => R
export type Mod<T> = (e: T) => void
export type ModA<T> = (e: T) => Promise<void>
export type NI<T> = T extends T ? T : never
export type ValueOf<T> = T[keyof T]

export type OfTable<D, T extends { [i: string]: any }> = {
  [K in keyof T]: { k: K } & T[K] & D }

export type Converted<Z extends { [i: string]: any }, T, K extends keyof Z> =
{ [U in keyof Z[K] as Z[keyof Z] extends Z[K][U] ? U : never]: T }
export type Converter<Z extends { [i: string]: any }, T, K extends keyof Z> =
(r: Converted<Z, T, K>, e: Z[K]) => T
export type Conversion<Z extends { [i: string]: any }, T> =
{ [K in keyof Z]: Converter<Z, T, K> }

export const
last: <T>(a: T[]) => T | undefined = a => a[a.length - 1],
edi: <Y>(f: () => Y) => Y = f => f(),
di: <X, Y>(x: X, f: (x: X) => Y) => Y = (x, f) => f(x),
dj: <Y>(f: () => Y) => Y = f => f(),
tr = <T, R>(t: T, f: (t: NonNullable<T>) => R): R | null => t ? f(t) : null,
flip = <A, B>([a, b]: [A, B]): [B, A] => [b, a],
flip_all = <A, B>(l: [A, B][]): [B, A][] => l.map(flip),
cnn = (f: (() => void) | null) => f && f(),
opt = <T>(x: T): [NonNullable<T>] | [] => x ? [x] : [],
optf = <T, U>(x: T, f: (x: NonNullable<T>) => U): [U] | [] => x ? [f(x)] : [],
cascade = <T, U>(f: (ctx: U) => T, a: U, b: U) => f(a) || f(b),
uniques = <T>(a: T[]) => [...new Set(a)],
lookup = <K, V>(a: [K, V][], i: K): [K, V] | null => a.reduce<[K, V] | null>((p, e) => e[0] === i ? e : p, null),
visit: VisitG = o => (e, ...r) => ((o as any)[e.k])(e, ...r),
visit_default: VisitDefault = () => (d, o) => (e, ...r) => ((o as any)[e.k] || d)(e, ...r),
bsearch = <T>(c: (a: T) => number, a: T[]): [number, T] | null => {
  let start = 0, end = a.length - 1
  while (start <= end) {
      const
        i = Math.floor((start + end) / 2),
        e = a[i] as T,
        p = c(e)
      if (p == 0) {
          return [i, e] }
      else if (p > 0) {
        start = i + 1 }
      else {
        end = i - 1 } }
  return null },
merge_once = <T>(c: (a: T, b: T) => number, a: T[], b: T[]): T[] => {
  const r: T[] = []
  for (;;) {
    if (a[0] && b[0]) {
      const p = c(a[0], b[0])
      if (p == 0) {
        r.push(a[0])
        a.shift()
        b.shift() }
      else if (p < 0) {
        r.push(a[0])
        a.shift() }
      else {
        r.push(b[0])
        b.shift() } }
    else if (a[0]) {
      r.push(a[0])
      a.shift() }
    else if (b[0]) {
      r.push(b[0])
      b.shift() }
    else break; }
  return r; },
mod = <T>(e: T, f: Mod<T>): T => { f(e); return e },
moda = async <T>(e: T, f: ModA<T>): Promise<T> => { await f(e); return e },
assign = <A extends {}, T extends A>(e: T, a: A) => Object.assign(e, a),
partition = <T>(arr: T[], fn: (e: T, i: number, arr: T[]) => boolean) =>
  arr.reduce<[T[], T[]]>(
    (p, e, i, a) => {
      p[fn(e, i, a) ? 0 : 1].push(e)
      return p },
    [[], []] )