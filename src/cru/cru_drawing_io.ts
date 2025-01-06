import { print, Term, make, evaluate, Graph } from './cru.js'

export type Exec = (f: Term, ctx: CanvasRenderingContext2D) => Promise<Graph>

type Fatal = (reason: string) => never
type Stack = any[]

export const exec: Exec = async (io, ctx) => {
const car = make("abs", "x", make("abs", "y", make("ref", "x")))
const cdr = make("abs", "x", make("abs", "y", make("ref", "y")))
const
  s: Stack = [],
  fatal: Fatal = r => { throw new Error(`Because ${r}, the IO \`${print(io)}\` is invalid.`) }
let iops = 0
const get_lit: (e: Term) => any = e => (e = evaluate(e), e[0] !== "lit" ? fatal(`a literal is required where \`${print(e)}\` was provided`) : e[1])
for (;;) {
  if (iops++ > 1e3) {
    fatal("there were too many IOs") }
  const iop: [Graph] = [io]
  const op = evaluate(make("app", make("bar", iop), car))
  if (op[0] !== "lit") {
    fatal (`a string is required where \`${print(op)}\` was provided`) }
  let x: Term
  switch (op[1]) {

  // sequencing
  case "bind": {
    const p1: [Graph] = [make("app", make("bar", iop), cdr)]
    const v1 = make("app", make("bar", p1), car)
    const v2 = make("app", make("bar", p1), cdr)
    s.push(v2)
    io = v1
    continue }
  case "return": {
    x = make("app", make("bar", iop), cdr)
    break }
  case "yield": {
    await new Promise(c => window.setTimeout(c, 0))
    x = make("lit", true)
    break }

  // drawing
  case "arc": {
    const p0: [Graph] = [make("app", make("bar", iop), cdr)]
    const v0 = make("app", make("bar", p0), car)
    const p1: [Graph] = [make("app", make("bar", p0), cdr)]
    const v1 = make("app", make("bar", p1), car)
    const p2: [Graph] = [make("app", make("bar", p1), cdr)]
    const v2 = make("app", make("bar", p2), car)
    const p3: [Graph] = [make("app", make("bar", p2), cdr)]
    const v3 = make("app", make("bar", p3), car)
    const v4 = make("app", make("bar", p3), cdr)
    x = make("lit", ctx.arc(get_lit(v0), get_lit(v1), get_lit(v2), get_lit(v3), get_lit(v4)))
    break }
  case "textAlign": {
    const v0 = make("app", make("bar", iop), cdr)
    x = make("lit", ctx.textAlign = get_lit(v0))
    break }
  case "textBaseline": {
    const v0 = make("app", make("bar", iop), cdr)
    x = make("lit", ctx.textBaseline = get_lit(v0))
    break }
  case "font": {
    const v0 = make("app", make("bar", iop), cdr)
    x = make("lit", ctx.font = get_lit(v0))
    break }
  case "fillText": {
    const p0: [Graph] = [make("app", make("bar", iop), cdr)]
    const v0 = make("app", make("bar", p0), car)
    const p1: [Graph] = [make("app", make("bar", p0), cdr)]
    const v1 = make("app", make("bar", p1), car)
    const v2 = make("app", make("bar", p1), cdr)
    x = make("lit", ctx.fillText(get_lit(v0), get_lit(v1), get_lit(v2)))
    break }
  case "resetTransform": {
    x = make("lit", ctx.resetTransform())
    break }
  case "getTransform": {
    x = make("lit", ctx.getTransform())
    break }
  case "setTransform": {
    const p0: [Graph] = [make("app", make("bar", iop), cdr)]
    const v0 = make("app", make("bar", p0), car)
    const p1: [Graph] = [make("app", make("bar", p0), cdr)]
    const v1 = make("app", make("bar", p1), car)
    const p2: [Graph] = [make("app", make("bar", p1), cdr)]
    const v2 = make("app", make("bar", p2), car)
    const p3: [Graph] = [make("app", make("bar", p2), cdr)]
    const v3 = make("app", make("bar", p3), car)
    const p4: [Graph] = [make("app", make("bar", p3), cdr)]
    const v4 = make("app", make("bar", p4), car)
    const v5 = make("app", make("bar", p4), cdr)
    x = make("lit", ctx.setTransform(get_lit(v0), get_lit(v1), get_lit(v2), get_lit(v3), get_lit(v4), get_lit(v5)))
    break }
  case "transform": {
    const p0: [Graph] = [make("app", make("bar", iop), cdr)]
    const v0 = make("app", make("bar", p0), car)
    const p1: [Graph] = [make("app", make("bar", p0), cdr)]
    const v1 = make("app", make("bar", p1), car)
    const p2: [Graph] = [make("app", make("bar", p1), cdr)]
    const v2 = make("app", make("bar", p2), car)
    const p3: [Graph] = [make("app", make("bar", p2), cdr)]
    const v3 = make("app", make("bar", p3), car)
    const p4: [Graph] = [make("app", make("bar", p3), cdr)]
    const v4 = make("app", make("bar", p4), car)
    const v5 = make("app", make("bar", p4), cdr)
    x = make("lit", ctx.transform(get_lit(v0), get_lit(v1), get_lit(v2), get_lit(v3), get_lit(v4), get_lit(v5)))
    break }
  case "beginPath": {
    x = make("lit", ctx.beginPath())
    break }
  case "moveTo": {
    const p0: [Graph] = [make("app", make("bar", iop), cdr)]
    const v0 = make("app", make("bar", p0), car)
    const v1 = make("app", make("bar", p0), cdr)
    x = make("lit", ctx.moveTo(get_lit(v0), get_lit(v1)))
    break }
  case "lineTo": {
    const p0: [Graph] = [make("app", make("bar", iop), cdr)]
    const v0 = make("app", make("bar", p0), car)
    const v1 = make("app", make("bar", p0), cdr)
    x = make("lit", ctx.lineTo(get_lit(v0), get_lit(v1)))
    break }
  case "stroke": {
    x = make("lit", ctx.stroke())
    break }
  case "fill": {
    x = make("lit", ctx.fill())
    break }
  case "strokeStyle": {
    const v0 = make("app", make("bar", iop), cdr)
    x = make("lit", ctx.strokeStyle = get_lit(v0))
    break }
  case "fillStyle": {
    const v0 = make("app", make("bar", iop), cdr)
    x = make("lit", ctx.fillStyle = get_lit(v0))
    break }
  case "fillRect": {
    const p0: [Graph] = [make("app", make("bar", iop), cdr)]
    const v0 = make("app", make("bar", p0), car)
    const p1: [Graph] = [make("app", make("bar", p0), cdr)]
    const v1 = make("app", make("bar", p1), car)
    const p2: [Graph] = [make("app", make("bar", p1), cdr)]
    const v2 = make("app", make("bar", p2), car)
    const v3 = make("app", make("bar", p2), cdr)
    x = make("lit", ctx.fillRect(get_lit(v0), get_lit(v1), get_lit(v2), get_lit(v3)))
    break }

  default: {
    fatal(`no io operation named \`${print(op)}\` is defined`) } }
  const f = s.pop()
  if (!f) {
    return x }
  io = make("app", f, x) } }
