import { homproc } from "./run.js"
import { Goals, Proof, Prop, Scope, all, app, exs, imp, ref, visit } from "./lang.js"
import { print_prop } from "./print.js"

const fatal = (m: string) => { throw new Error(m) }

export const is_closed = (e: Prop, o: string[]) => homproc<boolean>((call, cc, ret) => {
  type RealWorld = ReturnType<typeof ret>
  const t: (e: Prop) => (o: [string, boolean][], l: boolean) => RealWorld = visit({
    all: e => (o, l) => l ? ret(false) : cc(s(e.body, [[e.id, false], ...o], false)),
    exs: e => (o, l) => l ? ret(false) : cc(s(e.body, [[e.id, false], ...o], false)),
    imp: e => (o, l) => l ? ret(false) : call(s(e.lhs, o, false), dx => dx ? cc(s(e.rhs, o, false)) : ret(false)),
    app: e => (o, _l) => call(s(e.lhs, o, true), dx => dx ? cc(s(e.rhs, o, false)) : ret(false)),
    ref: e => (o, l) => ret(-1 !== o.findIndex(([i, s]) => l ? s && i == e.id : i == e.id)) })
  const s = (e: Prop, o: [string, boolean][], l: boolean) => () => t(e)(o, l)
  return s(e, o.map(e => [e, true]), false)() })

const occurs_free = (i: string, e: Prop) => homproc<boolean>((call, cc, ret) => {
type RealWorld = ReturnType<typeof ret>
const t: (e: Prop) => RealWorld = visit({
  all: e => e.id === i ? ret(false) : cc(s(e.body)),
  exs: e => e.id === i ? ret(false) : cc(s(e.body)),
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
const t: (e: Prop) => RealWorld = visit({
  all: e => e.id === i ? ret(e) : occurs_free(e.id, x) ? (j => call(s(beta(e.id, ref(j), e.body)), dx => ret(all(j, dx))))(fresh(e.id)) : call(s(e.body), dx => ret(all(e.id, dx))),
  exs: e => e.id === i ? ret(e) : occurs_free(e.id, x) ? (j => call(s(beta(e.id, ref(j), e.body)), dx => ret(exs(j, dx))))(fresh(e.id)) : call(s(e.body), dx => ret(exs(e.id, dx))),
  imp: e => call(s(e.lhs), dx => call(s(e.rhs), dy => ret(imp(dx, dy)))),
  app: e => call(s(e.lhs), dx => call(s(e.rhs), dy => dx.kind === "all" ? ret(beta(dx.id, dy, dx.body)) : ret(app(dx, dy)))),
  ref: e => ret(e.id === i ? x : e) })
const s = (e: Prop) => () => t(e)
return s(e)() })

export const compare = (x: Prop, y: Prop): boolean => {
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
  else if (x.kind === "exs" && y.kind === "exs") {
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
const g: Goals = [{ scope: { props: [], proofs: [] }, prop: e }]
try {
  for (;;) {
    const s = l.shift()
    if (!s) {
      return [g, []] }
    const gp = g.shift()
    if (!gp) {
      return fatal(`(${s.where}): Expected \`qed\`.`) }
    switch (s.kind) {
      case "intro": {
        for (const id of s.ids) {
          switch (gp.prop.kind) {
            case "all": {
              if (id.kind !== "ref") {
                return fatal(`(${s.where}): Expected an identifier to bind proposition.`) }
              if (gp.scope.props.indexOf(id.id) !== -1 || o.props.indexOf(id.id) !== -1) {
                fatal(`(${s.where}): Proposition name \`${id.id}\` already used.`) }
              gp.scope.props.push(id.id)
              gp.prop = beta(gp.prop.id, ref(id.id), gp.prop.body)
              continue }
            case "imp" : {
              if (gp.prop.lhs.kind === "exs") {
                if (id.kind !== "ref") {
                  return fatal(`(${s.where}): Expected an identifier to bind proposition.`) }
                if (gp.scope.props.indexOf(id.id) !== -1 || o.props.indexOf(id.id) !== -1) {
                  fatal(`(${s.where}): Proposition name \`${id.id}\` already used.`) }
                gp.scope.props.push(id.id)
                gp.prop = imp(beta(gp.prop.lhs.id, id, gp.prop.lhs.body), gp.prop.rhs) }
              else {
                if (
                  -1 !== gp.scope.proofs.findIndex(([k, _v]) => compare(k, id)) ||
                  -1 !== o.proofs.findIndex(([k, _v]) => compare(k, id))) {
                  fatal(`(${s.where}): Evidence or theorem name \`${print_prop(id, false)}\` already used.`) }
                gp.scope.proofs.push([id.kind === "ref" && id.id === "*" ? gp.prop.lhs : id, [], gp.prop.lhs])
                gp.prop = gp.prop.rhs }
              continue }
            default : {
              fatal(`(${s.where}): No binders in goal proposition for \`intro\`:\n\n${print_prop(gp.prop, false)}`) } } }
        g.unshift(gp)
        continue }
      case "use": {
        if (gp.prop.kind !== "exs") {
          return fatal(`(${s.where}): \`use\` can't do anything with the goal proposition:\n\n${print_prop(gp.prop, false)}\n\n`) }
        if (!is_closed(s.prop, [...o.props, ...gp.scope.props])) {
          return fatal(`(${s.where}): Specialization is not closed:\n\n${print_prop(s.prop, false)}`) }
        g.unshift({ scope: { props: [...gp.scope.props], proofs: [...gp.scope.proofs] }, prop: beta(gp.prop.id, s.prop, gp.prop.body) })
        continue }
      case "push": {
        let hop = gp.scope.proofs.find(([k, _v]) => compare(k, s.hyp))
        let ho: Prop
        if (!hop) {
          hop = o.proofs.find(([k, _v]) => compare(k, s.hyp))
          if (!hop) return fatal(`(${s.where}): Unknown evidence or theorem \`${print_prop(s.hyp, false)}\`.`)
          ho = hop[2]
          for (const param of hop[1]) {
            const op = s.ops.shift()
            if (!op) {
              return fatal(`(${s.where}): Expected a specialization for schema \`${print_prop(hop[0], false)}\``) }
            if (!is_closed(op, [...o.props, ...gp.scope.props])) {
              return fatal(`(${s.where}): Specialization is not closed:\n\n${print_prop(op, false)}`) }
            ho = beta(param, op, ho) } }
        else {
          ho = hop[2] }
        for (const op of s.ops) {
          if (ho.kind === "all") {
            if (op.kind === "ref" && op.id === "?") {
              ho = beta(ho.id, gp.prop, ho.body) }
            else {
              if (!is_closed(op, [...o.props, ...gp.scope.props])) {
                fatal(`(${s.where}): Specialization is not closed:\n\n${print_prop(op, false)}`) }
              ho = beta(ho.id, op, ho.body) } }
          else if (ho.kind === "imp") {
            let hup = gp.scope.proofs.find(([k, _v]) => compare(k, op))
            if (!hup) {
              hup = o.proofs.find(([k, _v]) => compare(k, op))
              if (!hup) return fatal(`(${s.where}): Unknown evidence or theorem \`${print_prop(op, false)}\`.`) }
            let hu = hup[2]
            if (hup[1].length !== 0) {
              return fatal(`(${s.where}): Need a specialization for schema \`${print_prop(hup[0], false)}\``) }
            if (!compare(ho.lhs, hu)) return fatal(`(${s.where}): Bad modus ponens. Antecedent:\n\n${print_prop(ho.lhs, false)}\n\nMotive:\n\n${print_prop(hu, false)}\n\n`)
            ho = ho.rhs }
          else return fatal(`(${s.where}): \`apply\` can't do anything with the operand:\n\n${print_prop(ho, false)}\n\nApplied to:\n\n${print_prop(op, false)}\n\n`) }
        g.unshift({ scope: { props: [...gp.scope.props], proofs: [...gp.scope.proofs] }, prop: imp(ho, gp.prop) })
        continue }
      case "with": {
        if (s.hyp.kind !== "ref" || -1 === [...o.props, ...gp.scope.props].indexOf(s.hyp.id)) {
          return fatal(`(${s.where}): Generalization is not closed:\n\n${print_prop(s.hyp, false)}`) }
          g.unshift({ scope: { props: [...gp.scope.props], proofs: [...gp.scope.proofs] }, prop: all(s.hyp.id, gp.prop) })
        continue }
      case "apply": {
        let hop = gp.scope.proofs.find(([k, _v]) => compare(k, s.hyp))
        let ho: Prop
        if (!hop) {
          hop = o.proofs.find(([k, _v]) => compare(k, s.hyp))
          if (!hop) return fatal(`(${s.where}): Unknown evidence or theorem \`${print_prop(s.hyp, false)}\`.`)
          ho = hop[2]
          for (const param of hop[1]) {
            const op = s.ops.shift()
            if (!op) {
              return fatal(`(${s.where}): Expected a specialization for schema \`${print_prop(hop[0], false)}\``) }
            if (!is_closed(op, [...o.props, ...gp.scope.props])) {
              return fatal(`(${s.where}): Specialization is not closed:\n\n${print_prop(op, false)}`) }
            ho = beta(param, op, ho) } }
        else {
          ho = hop[2] }
        for (const op of s.ops) {
          if (ho.kind === "all") {
            if (op.kind === "ref" && op.id === "?") {
              ho = beta(ho.id, gp.prop, ho.body) }
            else {
              if (!is_closed(op, [...o.props, ...gp.scope.props])) {
                fatal(`(${s.where}): Specialization is not closed:\n\n${print_prop(op, false)}`) }
              ho = beta(ho.id, op, ho.body) } }
          else if (ho.kind === "imp") {
            let hup = gp.scope.proofs.find(([k, _v]) => compare(k, op))
            if (!hup) {
              hup = o.proofs.find(([k, _v]) => compare(k, op))
              if (!hup) return fatal(`(${s.where}): Unknown evidence or theorem \`${print_prop(op, false)}\`.`) }
            let hu = hup[2]
            if (hup[1].length !== 0) {
              return fatal(`(${s.where}): Need a specialization for schema \`${print_prop(hup[0], false)}\``) }
            if (!compare(ho.lhs, hu)) return fatal(`(${s.where}): Bad modus ponens. Antecedent:\n\n${print_prop(ho.lhs, false)}\n\nMotive:\n\n${print_prop(hu, false)}\n\n`)
            ho = ho.rhs }
          else return fatal(`(${s.where}): \`apply\` can't do anything with the operand:\n\n${print_prop(ho, false)}\n\nApplied to:\n\n${print_prop(op, false)}\n\n`) }
        let h = ho
        const gn: Goals = []
        for (;;) {
          if (compare(h, gp.prop)) {
            g.unshift(...gn)
            break }
          else if (h.kind === "imp") {
            gn.push({ scope: { props: [...gp.scope.props], proofs: [...gp.scope.proofs] }, prop: h.lhs })
            h = h.rhs }
          else {
            return fatal(`(${s.where}): \`apply\` couldn't make progress. Goal:\n\n${print_prop(gp.prop, false)}\n\nOperand:\n\n${print_prop(ho, false)}`) } }
        continue }
      case "sorry":
        continue } } }
catch (e) {
  return [g, [(e as Error).message]] } }