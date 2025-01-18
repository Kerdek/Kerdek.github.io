/*

run.ts
Theodoric Stier
All rights reserved 2024

This module assists in writing
non-recursive algorithms on recursive
data structures.

*/

type Stack = Process[]
type Branch = [] | [Process] | [Process, Process]
type Process = () => Branch
type Run = (x: Process) => void

type AsyncStack = AsyncProcess[]
type AsyncBranch = [] | [AsyncProcess] | [AsyncProcess, AsyncProcess]
type AsyncProcess = () => Promise<AsyncBranch>
type AsyncRun = (x: AsyncProcess) => Promise<void>

type HomCall<Result, RealWorld> = (u: () => RealWorld, v: (x: Result) => RealWorld) => RealWorld
type HomCC<_Result, RealWorld> = (u: () => RealWorld) => RealWorld
type HomRet<Result, RealWorld> = (x: Result) => RealWorld

type AsyncHomCall<Result, RealWorld> = (u: () => Promise<RealWorld>, v: (x: Result) => Promise<RealWorld>) => RealWorld
type AsyncHomCC<_Result, RealWorld> = (u: () => Promise<RealWorld>) => RealWorld
type AsyncHomRet<Result, RealWorld> = (x: Result) => RealWorld

type HomProc = <Result>(e: <RealWorld>(call: HomCall<Result, RealWorld>, cc: HomCC<Result, RealWorld>, ret: HomRet<Result, RealWorld>) => () => RealWorld) => Result
type AsyncHomProc = <Result>(e: <RealWorld>(call: AsyncHomCall<Result, RealWorld>, cc: AsyncHomCC<Result, RealWorld>, ret: AsyncHomRet<Result, RealWorld>) => () => Promise<RealWorld>) => Promise<Result>

const ret: Branch = []
const jmp: {
  (destination: () => Branch): Branch
  (destination: () => Promise<AsyncBranch>): AsyncBranch }= x => [x] as any

const call: {
  (destination: () => Branch, then: Process): Branch
  (destination: () => Promise<AsyncBranch>, then: AsyncProcess): AsyncBranch } = (x, y) => [x, y] as any

const run: Run = s => {
const y: Stack = [s]
let ops: number = 0
for (;;) {
  if (ops++ > 1e7) {
    throw new Error("Too many steps.") }
  const f = y.shift()
  if (!f) {
    return }
  y.unshift(...f()) } }

const async_run: AsyncRun = async s => {
const y: AsyncStack = [s]
let ops: number = 0
for (;;) {
  if (ops++ > 1e7) {
    throw new Error("Too many steps.") }
  const f = y.shift()
  if (!f) {
    return }
  y.unshift(...await f()) } }

export const homproc: HomProc = e => {
let d!: any
run(e((x, v) => call(x, () => v(d)), x => jmp(x), v => (d = v, ret)))
return d }

export const async_homproc: AsyncHomProc = async e => {
let d!: any
await async_run(e((x, v) => call(x, () => v(d)), x => jmp(x), v => (d = v, ret)))
return d }