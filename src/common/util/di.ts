export type Options<T extends {}> = { [I in keyof T]?: T[I] }
export type VisitDefault = <G extends { [K in string]: { k: K }}>() => <R, K extends keyof G, D extends (e: G[keyof G], ...r: E) => R, E extends any[], O extends { [i in keyof G]: i extends K ? (e: G[Extract<keyof G, i>], ...r: E) => R : undefined }>(d: D, o: { [i in K]: O[i] }) => (e: G[keyof G], ...r: E) => R
export type Visit<G extends { [K in string]: { k: K }}> = <R, E extends any[]>(o: { [i in keyof G]: (e: G[i], ...r: E) => R }) => (e: G[keyof G], ...r: E) => R
export type VisitG = <G extends { [K in string]: { k: K }}, R, E extends any[]>(o: { [i in keyof G]: (e: G[i], ...r: E) => R }) => (e: G[keyof G], ...r: E) => R
export type Mod<T> = (e: T) => void
export type ModA<T> = (e: T) => Promise<void>
export type Values<T> = T[keyof T]

export const
  edi: <Y>(f: () => Y) => Y = f => f(),
  di: <X, Y>(x: X, f: (x: X) => Y) => Y = (x, f) => f(x),
  dj: <Y>(f: () => Y) => Y = f => f(),
  tr = <T, R>(t: T, f: (t: NonNullable<T>) => R): R | null => t ? f(t) : null,
  cnn = (f: (() => void) | null) => f && f(),
  opt = <T>(x: T): [NonNullable<T>] | [] => x ? [x] : [],
  optl = <T>(x: T[] | undefined): T[] | [] => x ? [...x] : [],
  optf = <I extends string, T>(i: I, x: T): { [i in I]: NonNullable<T> } | {} => x ? { [i]: x } : {},
  cascade = <T, U>(f: (ctx: U) => T, a: U, b: U) => f(a) || f(b),
  uniques = <T>(a: T[]) => [...new Set(a)],
  lookup = <K, V>(a: [K, V][], i: K) => a.reduce<V | null>((p, [k, v]) => k === i ? v : p, null),
  visit: VisitG = o => (e, ...r) => ((o as any)[e.k])(e, ...r),
  visit_default: VisitDefault = () => (d, o) => (e, ...r) => ((o as any)[e.k] || d)(e, ...r),
  mod = <T>(e: T, f: Mod<T>): T => { f(e); return e },
  moda = async <T>(e: T, f: ModA<T>): Promise<T> => { await f(e); return e },
  assign = <A extends {}, T extends A>(e: T, a: A) => Object.assign(e, a),
  partition = <T>(arr: T[], fn: (e: T, i: number, arr: T[]) => boolean) =>
    arr.reduce<[T[], T[]]>(
      (p, e, i, a) => {
        p[fn(e, i, a) ? 0 : 1].push(e)
        return p },
      [[], []] )