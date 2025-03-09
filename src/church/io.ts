import { Value, EvaluateBranch, Graph } from './church.js'
import { evaluate } from './evaluate.js'
import { print_value } from './print.js'
import { read } from './read.js'

export type Exec = (f: Graph, get: () => Promise<string>, put: (s: string) => void, unput: () => void) => Promise<Graph>

type Fail = (reason: string) => never
type Stack = Value[]

const
  car = await read('λx y.x'),
  cdr = await read('λx y.y')

export const exec: Exec = async (e, get, put, unput) => {
const
  s: Stack = [],
  fatal: Fail = r => { throw new Error(`Because ${r}, the io is invalid.`) }
let iops = 0
let io: EvaluateBranch = (_rec, cc, _ret) => cc([e, {}])
for (;;) {
  if (iops++ > 1e3) {
    throw new Error("Too many IOs.") }
  const ior = evaluate(io);
  if (typeof ior !== "function") {
    fatal("a function was expected") }
  const op = evaluate(ior(car))
  if (typeof op !== "string") {
    fatal("a string was expected") }
  let x!: Graph
  switch (op) {

  // sequencing

  case "bind": {
    const iol = evaluate(ior(cdr))
    if (typeof iol !== "function") {
      fatal("a function was expected") }
    s.push(evaluate(iol(cdr)))
    io = iol(car)
    continue }
  case "return": {
    x = { kind: "app", lhs: { kind: "lit", value: ior }, rhs: cdr }
    break }
  case "yield": {
    await new Promise(c => window.setTimeout(c, 0))
    x = { kind: "lit", value: true }
    break }

  // fetch

  case "fetch": {
    const r = evaluate(ior(cdr))
    if (typeof r !== "string") {
      fatal("a string was expected") }
    let res = await fetch(`./${r}`);
    if (!res.ok) {
      fatal(`HTTP status ${res.status} while fetching \`./${r}\``) }
    x = { kind: "lit", value: await res.text() }
    break }

  // console io

  case "print": {
    put(print_value(evaluate(ior(cdr))))
    put("\n")
    x = { kind: "lit", value: true }
    break }

  case "get": {
    x = { kind: "lit", value: await get() }
    break }
  case "put": {
    const e = evaluate(ior(cdr))
    if (typeof e !== "string") {
      fatal("a string was expected"); }
    put(e)
    x = { kind: "lit", value: true }
    break }
  case "unput": {
    unput()
    x = { kind: "lit", value: true }
    break }

  default: {
    fatal(`no io operation named \`${op}\` is defined`) } }
  const f = s.pop()
  if (!f) {
    return x }
  if (typeof f !== "function") {
    fatal("a function was expected") }
  io = f(x) } }
