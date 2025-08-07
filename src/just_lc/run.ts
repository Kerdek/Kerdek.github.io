type EVCall<Result, RealWorld> = (u: RealWorld, v: (x: Result) => RealWorld) => RealWorld
type EVRet<Result, RealWorld> = (x: Result) => RealWorld

export type EVStem<Result> = <RealWorld>(
  call: EVCall<Result, RealWorld>,
  ret: EVRet<Result, RealWorld>) => RealWorld

export function evproc<Result>(s: EVStem<Result>) {
let d!: Result
const y: ((x: Result) => boolean)[] = []
let ops: number = 0
const call: EVCall<Result, boolean> = (u, v) => (e = u, y.unshift(v), true)
const ret: EVRet<Result, boolean> = x => (d = x, false)
let e = s(call, ret)
for (;;) {
  if (ops++ > 1e7) {
    throw new Error("Too many steps.") }
  if (e) {
    continue }
  for (;;) {
    if (ops++ > 1e7) {
      throw new Error("Too many steps.") }
    const f = y.shift()
    if (!f) {
      return d }
    if (f(d)) {
      break } } } }


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
  if (ops++ > 1e7) {
    throw new Error("Too many steps.") }
  if (e()) {
    continue }
  for (;;) {
    if (ops++ > 1e7) {
      throw new Error("Too many steps.") }
    const f = y.shift()
    if (!f) {
      return d }
    if (f(d)) {
      break } } } }

type DHomCall<Result, RealWorld> = (u: DHomStem<Result>, v: (x: Result) => RealWorld) => RealWorld
type DHomCC<Result, RealWorld> = (u: DHomStem<Result>) => RealWorld
type DHomRet<Result, RealWorld> = (x: Result) => RealWorld

export type DHomStem<Result> = <RealWorld>(
  call: DHomCall<Result, RealWorld>,
  cc: DHomCC<Result, RealWorld>,
  ret: DHomRet<Result, RealWorld>) => RealWorld

export function dhomproc<Result>(e: DHomStem<Result>) {
let d!: Result
const y: ((x: Result) => boolean)[] = []
let ops: number = 0
const call: DHomCall<Result, boolean> = (u, v) => (e = u, y.unshift(v), true)
const cc: DHomCC<Result, boolean> = u => (e = u, true)
const ret: DHomRet<Result, boolean> = x => (d = x, false)
for (;;) {
  if (ops++ > 1e7) {
    throw new Error("Too many steps.") }
  if (e(call, cc, ret)) {
    continue }
  for (;;) {
    if (ops++ > 1e7) {
      throw new Error("Too many steps.") }
    const f = y.shift()
    if (!f) {
      return d }
    if (f(d)) {
      break } } } }
