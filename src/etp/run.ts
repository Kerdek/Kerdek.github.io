type HomCall<Result, RealWorld> = (u: () => RealWorld, v: (x: Result) => RealWorld) => RealWorld
type HomCC<_Result, RealWorld> = (u: () => RealWorld) => RealWorld
type HomRet<Result, RealWorld> = (x: Result) => RealWorld

export type HomStem<Result> = <RealWorld>(
  call: HomCall<Result, RealWorld>,
  cc: HomCC<Result, RealWorld>,
  ret: HomRet<Result, RealWorld>) => RealWorld

export function homproc<Result>(s: HomStem<Result>) {
let d!: Result
const y: ((x: Result) => boolean)[] = []
let ops: number = 0
const call: HomCall<Result, boolean> = (u, v) => (e = u, y.unshift(v), true)
const cc: HomCC<Result, boolean> = u => (e = u, true)
const ret: HomRet<Result, boolean> = x => (d = x, false)
let e = () => s(call, cc, ret)
for (;;) {
  if (ops++ > 1e9) {
    throw new Error("Too many steps.") }
  if (e()) {
    continue }
  for (;;) {
    if (ops++ > 1e9) {
      throw new Error("Too many steps.") }
    const f = y.shift()
    if (!f) {
      return d }
    if (f(d)) {
      break } } } }