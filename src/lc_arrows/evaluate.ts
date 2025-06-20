import { Term, abs, app, imp, ref, visit } from "./church.js"
import { homproc } from "./run.js"
import { print } from "./print.js"

const fatal = (m: string) => { throw new Error(m) }

const occurs_free = (i: string, e: Term) => homproc<boolean>((call, cc, ret) => {
type RealWorld = ReturnType<typeof ret>
const t: (e: Term) => RealWorld = visit({
  app: e => call(s(e.lhs), dx => dx ? ret(true) : cc(s(e.rhs))),
  abs: e => e.id === i ? ret(false) : cc(s(e.body)),
  imp: e => call(s(e.lhs), dx => dx ? ret(true) : cc(s(e.rhs))),
  ref: e => ret(e.id === i) })
const s = (e: Term) => () => t(e)
return s(e)() })

const fresh = (() => {
let n = 0
return (i: string) => `†${i}${n++}`})()

const beta = (i: string, x: Term, e: Term) => homproc<Term>((call, _cc, ret) => {
type RealWorld = ReturnType<typeof ret>
const t: (e: Term) => RealWorld = visit({
  app: e => call(s(e.lhs), dx => call(s(e.rhs), dy => ret(dx === e.lhs && dy === e.rhs ? e : app(dx, dy)))),
  abs: e => e.id === i ? ret(e) : occurs_free(e.id, x) ? (j => call(s(beta(e.id, ref(j), e.body)), dx => ret(abs(j, dx))))(fresh(e.id)) : call(s(e.body), dx => ret(abs(e.id, dx))),
  imp: e => call(s(e.lhs), dx => call(s(e.rhs), dy => ret(dx === e.lhs && dy === e.rhs ? e : imp(dx, dy)))),
  ref: e => ret(e.id === i ? x : e) })
const s = (e: Term) => () => t(e)
return s(e)() })

const compare_simple = (x: Term, y: Term): boolean => {
const s: [Term, Term][] = []
for (;;) {
if (x === y) {}
else {
  if (x.kind === "app" && y.kind === "app") {
    s.push([x.rhs, y.rhs])
    x = x.lhs
    y = y.lhs
    continue }
  else if (x.kind === "abs" && y.kind === "abs") {
    if (x.id === y.id) {
      x = x.body
      y = y.body
      continue }
    const f = ref(fresh(x.id))
    x = beta(x.id, f, x.body)
    y = beta(y.id, f, y.body)
    continue }
  else if (x.kind === "imp" && y.kind === "imp") {
    s.push([x.rhs, y.rhs])
    x = x.lhs
    y = y.lhs
    continue }
  else if (x.kind === "ref" && y.kind === "ref" && x.id === y.id) { }
  else return false }
const f = s.pop()
if (!f) {
  return true }
x = f[0]
y = f[1] } }

const compare = (x: Term, y: Term): [Term, Term] | null => {
const s: [Term, Term][] = []
for (;;) {
if (compare_simple(x, y)) {}
else {
  x = evaluate(x)
  y = evaluate(y)
  if (x.kind === "app" && y.kind === "app") {
    s.push([x.rhs, y.rhs])
    x = x.lhs
    y = y.lhs
    continue }
  else if (x.kind === "abs" && y.kind === "abs") {
    if (x.id === y.id) {
      x = x.body
      y = y.body
      continue }
    const f = ref(fresh(x.id))
    x = beta(x.id, f, x.body)
    y = beta(y.id, f, y.body)
    continue }
  else if (x.kind === "imp" && y.kind === "imp") {
    s.push([x.rhs, y.rhs])
    x = x.lhs
    y = y.lhs
    continue }
  else if (x.kind === "ref" && y.kind === "ref" && x.id === y.id) { }
  else return [x, y] }
const f = s.pop()
if (!f) {
  return null }
x = f[0]
y = f[1] } }

export const evaluate = (e: Term) => homproc<Term>((call, cc, ret) => {
type RealWorld = ReturnType<typeof ret>
const t: (e: Term) => (d: boolean) => RealWorld = visit({
  app: e => d => call(s(e.lhs, d), dx => (e.lhs = dx, call(s(e.rhs, d), dy => (e.rhs = dy, visit({
    app: () => ret(e),
    abs: dx => cc(s(beta(dx.id, e.rhs, dx.body), d)),
    imp: dx => !d ? (c => c ? fatal(`Assertion Failed:\n${print(c[0])}\n\nis not equivalent to\n\n${print(c[1])}`) : cc(s(dx.rhs, d)))(compare(dx.lhs, e.rhs)) : ret(e),
    ref: () => ret(e) })(dx))))),
  abs: e => () => ret(e),
  imp: e => () => ret(e),
  ref: e => () => ret(e) })
const s = (e: Term, d: boolean) => () => t(e)(d)
return s(e, false)() })