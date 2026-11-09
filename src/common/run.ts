// sync and promise trampolines

export type EntryPointV = <P, R>(t: RunV<P, R>) => P
export type RunV<P, R> = {
branch: (u: () => R) => P,
proc: <A extends any[]>(u: (...a: A) => R) => (...a: A) => P,
call: (u: P, v: () => R) => R,
cc: (u: P) => R,
ret: () => R }

export type EntryPoint<V> = <P, R>(t: Run<V, P, R>) => P
export type Run<V, P, R> = {
branch: (u: () => R) => P,
proc: <A extends any[]>(u: (...a: A) => R) => (...a: A) => P,
call: (u: P, v: (x: V) => R) => R,
cc: (u: P) => R,
ret: (x: V) => R }

export type EntryPointVA = <P, R>(t: RunVA<P, R>) => P
export type RunVA<P, R> = {
branch: (u: () => Promise<R>) => P,
proc: <A extends any[]>(u: (...a: A) => Promise<R>) => (...a: A) => P,
call: (u: P, v: () => Promise<R>) => R,
cc: (u: P) => R,
ret: () => R }

export type EntryPointA<V> = <P, R>(t: RunAsync<V, P, R>) => P
export type RunAsync<V, P, R> = {
branch: (u: () => Promise<R>) => P,
proc: <A extends any[]>(u: (...a: A) => Promise<R>) => (...a: A) => P,
call: (u: P, v: (x: V) => Promise<R>) => R,
cc: (u: P) => R,
ret: (x: V) => R }

export const

run_v = (s: EntryPointV): void => {
type R = boolean
type P = () => R
const z: (() => R)[] = []
let f: any = s<P, R>({
  branch: u => u,
  proc: u => (...a) => () => u(...a),
  call: (u, v) => (z.push(v), f = u, true),
  cc: u => (f = u, true),
  ret: () => !!(f = z.pop()) })
while (f()); },

run = <V>(s: <P, R>(t: Run<V, P, R>) => P): V => {
type R = boolean
type P = () => R
const z: ((x: V) => R)[] = []
let f: any = s<P, R>({
  branch: u => u,
  proc: u => (...a) => () => u(...a),
  call: (u, v) => (z.push(v), f = u, true),
  cc: u => (f = u, true),
  ret: x => {
    const t = z.pop()
    f = t ? () => t(x) : x
    return !!t } })
while (f());
return f },

run_va = async (s: EntryPointVA): Promise<void> => {
type R = boolean
type P = () => Promise<R>
const z: (() => Promise<R>)[] = []
let f: any = s<P, R>({
  branch: u => u,
  proc: u => (...a) => () => u(...a),
  call: (u, v) => (z.push(v), f = u, true),
  cc: u => (f = u, true),
  ret: () => !!(f = z.pop()) })
while (await f()); },

run_a = async <V>(s: EntryPointA<V>): Promise<V> => {
type R = boolean
type P = () => Promise<R>
const z: ((x: V) => Promise<R>)[] = []
let f: any = s<P, R>({
  branch: u => u,
  proc: u => (...a) => () => u(...a),
  call: (u, v) => (z.push(v), f = u, true),
  cc: u => (f = u, true),
  ret: x => {
    const t = z.pop()
    f = t ? () => t(x) : x
    return !!t } })
while (await f());
return f }
