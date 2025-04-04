import { homproc } from "./run.js"
import { Goals, Proof, Prop, Scope, all, app, imp, ref, visit } from "./lang.js"
import { print_prop } from "./print.js"

const fatal = (m: string) => { throw new Error(m) }

export const is_closed = (e: Prop, o: string[]) => homproc<boolean>((call, cc, ret) => {
type RealWorld = ReturnType<typeof ret>
const t: (e: Prop) => (o: [string, boolean][], l: boolean) => RealWorld = visit({
  all: e => (o, l) => l ? ret(false) : cc(s(e.body, [[e.id, e.schema], ...o], false)),
  imp: e => (o, l) => l ? ret(false) : call(s(e.lhs, o, false), dx => dx ? cc(s(e.rhs, o, false)) : ret(false)),
  app: e => (o, _l) => call(s(e.lhs, o, true), dx => dx ? cc(s(e.rhs, o, false)) : ret(false)),
  ref: e => (o, l) => ret(-1 !== o.findIndex(([i, s]) => l ? s && i == e.id : i == e.id)) })
const s = (e: Prop, o: [string, boolean][], l: boolean) => () => t(e)(o, l)
return s(e, o.map(e => [e, true]), false)() })

const occurs_free = (i: string, e: Prop) => homproc<boolean>((call, cc, ret) => {
type RealWorld = ReturnType<typeof ret>
const t: (e: Prop) => RealWorld = visit({
  all: e => e.id === i ? ret(false) : cc(s(e.body)),
  imp: e => call(s(e.lhs), dx => dx ? ret(true) : cc(s(e.rhs))),
  app: e => call(s(e.lhs), dx => dx ? ret(true) : cc(s(e.rhs))),
  ref: e => ret(e.id === i) })
const s = (e: Prop) => () => t(e)
return s(e)() })

const fresh = (() => {
let n = 0
return (i: string) => `†${i}${n++}`})()

const beta = (i: string, x: Prop, e: Prop) => homproc<Prop>((call, _cc, ret) => {
type RealWorld = ReturnType<typeof ret>
const t: (e: Prop) => (l: boolean) => RealWorld = visit({
  all: e => l => l ? ret(e) : e.id === i ? ret(e) : occurs_free(e.id, x) ? (j => call(s(e.schema ? betap(e.id, ref(j), e.body) : beta(e.id, ref(j), e.body), false), dx => ret(all(j, e.schema, dx))))(fresh(e.id)) : call(s(e.body, false), dx => ret(all(e.id, e.schema, dx))),
  imp: e => l => l ? ret(e) : call(s(e.lhs, false), dx => call(s(e.rhs, false), dy => ret(imp(dx, dy)))),
  app: e => () => call(s(e.lhs, true), dx => call(s(e.rhs, false), dy => dx.kind === "all" ? ret(dx.schema ? betap(dx.id, dy, dx.body) : beta(dx.id, dy, dx.body)) : ret(app(dx, dy)))),
  ref: e => l => ret(!l && e.id === i ? x : e) })
const s = (e: Prop, l: boolean) => () => t(e)(l)
return s(e, false)() })

const betap = (i: string, x: Prop, e: Prop) => homproc<Prop>((call, _cc, ret) => {
type RealWorld = ReturnType<typeof ret>
const t: (e: Prop) => RealWorld = visit({
  all: e => e.id === i ? ret(e) : occurs_free(e.id, x) ? (j => call(s(e.schema ? betap(e.id, ref(j), e.body) : beta(e.id, ref(j), e.body)), dx => ret(all(j, e.schema, dx))))(fresh(e.id)) : call(s(e.body), dx => ret(all(e.id, e.schema, dx))),
  imp: e => call(s(e.lhs), dx => call(s(e.rhs), dy => ret(imp(dx, dy)))),
  app: e => call(s(e.lhs), dx => call(s(e.rhs), dy => dx.kind === "all" ? ret(dx.schema ? betap(dx.id, dy, dx.body) : beta(dx.id, dy, dx.body)) : ret(app(dx, dy)))),
  ref: e => ret(e.id === i ? x : e) })
const s = (e: Prop) => () => t(e)
return s(e)() })

const compare = (x: Prop, y: Prop): boolean => {
const s: [Prop, Prop][] = []
for (;;) {
if (x === y) {}
else {
  if (x.kind === "all" && y.kind === "all") {
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
  else if (x.kind === "app" && y.kind === "app") {
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

export const evaluate = (l: Proof, e: Prop, o: Scope): [Goals, string[]] => {
const g: Goals = [{ scope: { props: new Set, proofs: {} }, prop: e }]
try {
  for (;;) {
    const s = l.shift()
    if (!s) {
      return [g, []] }
    const gp = g.shift()
    if (!gp) {
      return fatal(`(${s.where}): Expected \`qed\`.`) }
    switch (s.kind) {
      case "intro":
        for (const id of s.ids) {
          switch (gp.prop.kind) {
            case "all":
              if (gp.scope.props.has(id) || o.props.has(id)) {
                fatal(`(${s.where}): Proposition name \`${id}\` already used.`) }
              gp.scope.props.add(id)
              gp.prop = gp.prop.schema ? betap(gp.prop.id, ref(id), gp.prop.body) : beta(gp.prop.id, ref(id), gp.prop.body)
              continue
            case "imp" :
              if (id in gp.scope.proofs || id in o.proofs) {
                fatal(`(${s.where}): Evidence or theorem name \`${id}\` already used.`) }
              gp.scope.proofs[id] = gp.prop.lhs
              gp.prop = gp.prop.rhs
              continue
            default :
              fatal("Not enough binders.") } }
        g.unshift(gp)
        continue
      case "apply":
        let ho = gp.scope.proofs[s.hyp]
        if (!ho) {
          ho = o.proofs[s.hyp]
          if (!ho) return fatal(`(${s.where}): Unknown evidence or theorem \`${s.hyp}\` .`) }
        for (const op of s.ops) {
          while (ho.kind === "all" && ho.id[0] === "?") {
            ho = beta(ho.id, gp.prop, ho.body) }
          if (ho.kind === "all") {
            if (!is_closed(op, [...o.props, ...gp.scope.props])) {
              fatal(`(${s.where}): Specialization is not closed:\n\n${print_prop(op, false)}`) }
            ho = ho.schema ? betap(ho.id, op, ho.body) : beta(ho.id, op, ho.body) }
          else if (ho.kind === "imp" && op.kind === "ref") {
            let hu = gp.scope.proofs[op.id]
            if (!hu) {
              hu = o.proofs[op.id]
              if (!hu) return fatal(`(${s.where}): Unknown evidence or theorem.`) }
            if (!compare(ho.lhs, hu)) return fatal(`(${s.where}): Bad modus ponens. Antecedent:\n\n${print_prop(ho.lhs, false)}\n\nMotive:\n\n${print_prop(hu, false)}`)
            ho = ho.rhs }
          else return fatal(`(${s.where}): \`apply\` can't do anything with the goal proposition:\n\n${print_prop(gp.prop, false)}`) }
        while (ho.kind === "all" && ho.id[0] === "?") {
          ho = beta(ho.id, gp.prop, ho.body) }
        let h = ho
        const gn: Goals = []
        for (;;) {
          if (compare(h, gp.prop)) {
            g.unshift(...gn)
            break }
          else if (h.kind === "imp") {
            gn.push({ scope: { props: new Set([...gp.scope.props]), proofs: { ...gp.scope.proofs } }, prop: h.lhs })
            h = h.rhs }
          else {
            g.unshift({ scope: { props: new Set([...gp.scope.props]), proofs: { ...gp.scope.proofs } }, prop: imp(ho, gp.prop) })
            break } }
        continue
      case "sorry":
        continue } } }
catch (e) {
  return [g, [(e as Error).message]] } }