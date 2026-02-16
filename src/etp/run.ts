export type Run<Result, Proc, World> = {
branch: (u: () => World) => Proc,
proc: <Args extends any[]>(u: (...a: Args) => World) => (...a: Args) => Proc,
call: (u: Proc, v: (x: Result) => World) => World,
cc: (u: Proc) => World,
ret: (x: Result) => World }

export const run = <A extends any[], V>(s: <P, R>(f: Run<V, P, R>) => (...a: A) => P) => (...a: A): V => {
type F = () => F | undefined

let d!: V
let f: F | undefined = (() => {
  type R = boolean
  type P = () => R
  type Y = (x: V) => R

  const z: Y[] = []
  let e: P = s<P, R>({
    branch: u => u,
    proc: u => (...a) => () => u(...a),
    call: (u, v) => (e = u, z.unshift(v), true),
    cc: u => (e = u, true),
    ret: x => (d = x, false) })(...a)

  let push: F = () =>
    e() ? push : pop(z.shift())
  let pop = (y: Y | undefined): F => () =>
    !y ? undefined : y(d) ? push : pop(z.shift())

  return push })()

for (;;) {
  if (!f) {
    return d }
  else {
    f = f() } } }