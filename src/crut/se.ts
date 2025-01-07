import { di } from "./di.js"
import { scanner } from "./scanner.js"
import { tokenizer, Tokenizer } from "./tokenizer.js"


type Term =
  TermLit | TermVar | TermLam | TermApp |
  TermRcd | TermSel | TermLet

type TermLit = { kind: "lit", value: Number }
type TermVar = { kind: "var", name: string }
type TermLam = { kind: "lam", name: string, body: Term }
type TermApp = { kind: "app", lhs: Term, rhs: Term }
type TermRcd = { kind: "rcd", fields: [string, Term][] }
type TermSel = { kind: "sel", receiver: Term, fieldName: string }
type TermLet = { kind: "let", isRec: boolean, name: string, rhs: Term, body: Term }

type SimpleType =
  SimpleTypeVariable | SimpleTypePrimitive |
  SimpleTypeFunction | SimpleTypeRecord

type SimpleTypeVariable = { kind: "variable", st: VariableState }
type SimpleTypePrimitive = { kind: "primitive", name: string }
type SimpleTypeFunction = { kind: "function", lhs: SimpleType, rhs: SimpleType }
type SimpleTypeRecord = { kind: "record", fields: [string, SimpleType][] }

type Typ =
  TypTop | TypBot | TypUnion | TypInter |
  TypFunction | TypRecord | TypRecursive |
  TypVariable | TypPrimitive

type TypTop = { kind: "top" }
type TypBot = { kind: "bot" }
type TypUnion = { kind: "union", lhs: Typ, rhs: Typ }
type TypInter = { kind: "inter", lhs: Typ, rhs: Typ }
type TypFunction = { kind: "function", lhs: Typ, rhs: Typ }
type TypRecord = { kind: "record", fields: [string, Typ][] }
type TypRecursive = { kind: "recursive", name: string, body: Typ }
type TypVariable = { kind: "variable", name: string }
type TypPrimitive = { kind: "primitive", name: string }

// type TermKind = Term['kind']
type SimpleTypeKind = SimpleType['kind']
type TypKind = Typ['kind']

// type TermSorts = { [i in TermKind]: Term & { kind: i } }
type SimpleTypeSorts = { [i in SimpleTypeKind]: SimpleType & { kind: i } }
type TypSorts = { [i in TypKind]: Typ & { kind: i } }

// type VisitTerm = <K extends TermKind, R>(o: { [i in K]: (e: TermSorts[i]) => R }) => <I extends K>(e: TermSorts[I]) => R
type VisitSimpleType = <K extends SimpleTypeKind, R>(o: { [i in K]: (e: SimpleTypeSorts[i]) => R }) => <I extends K>(e: SimpleTypeSorts[I]) => R
type VisitTyp = <K extends TypKind, R>(o: { [i in K]: (e: TypSorts[i]) => R }) => <I extends K>(e: TypSorts[I]) => R

// const visit_term: VisitTerm = o => e => (f => f(e))(o[e.kind as keyof typeof o])
const visit_simple_type: VisitSimpleType = o => e => (f => f(e))(o[e.kind as keyof typeof o])
const visit_typ: VisitTyp = o => e => (f => f(e))(o[e.kind as keyof typeof o])

type VariableState = { lowerBounds: SimpleType[], upperBounds: SimpleType[] }

type Ctx = { [i: string]: SimpleType }

const read_term: (tk: Tokenizer) => Term = tk => {
const
fatal: (m: string) => never = m => {
  const w = tk.pos()
  throw new Error(`(${w[0]}:${w[1]}:${w[2]}): term parser: ${m}`) },
rec_defs: (o: [string, Term][]) => Term = o =>
  di(tk.take("identifier"), i =>
  !i ? fatal(`Expected an identifier.`) :
  !tk.take("colon") ? fatal(`Expected \`:\`.`) :
  di(expression(), y =>
  di([...o, [i[1], y]] as [string, Term][], r =>
  tk.take("rbrace") ? { kind: "rcd", fields: r } :
  tk.take("comma") ? rec_defs(r) :
  fatal(`Expected \`,\` or \`}\`.`)))),
parameters: () => Term = () =>
  tk.take("dot") ? expression() :
  di(tk.take("identifier"), i =>
  !i ? fatal(`Expected an identifier or \`.\`.`) :
  di(parameters(), dx =>
  ({ kind: "lam", name: i[1], body: dx }))),
try_primary: () => null | (() => Term) = () =>
  tk.take("lbrace") ?
    () =>
      tk.take("rbrace") ? { kind: "rcd", fields: [] } :
      rec_defs([]) :
  tk.take("rsolidus") ?
    parameters :
  tk.take("lparen") ?
    () =>
      di(expression(), x =>
      tk.take("rparen") ? x :
      fatal(`Expected \`)\`.`)) :
  tk.take("let") ?
    () =>
      di(tk.take("identifier"), i =>
      !i ? fatal(`Expected an identifier.`) :
      !tk.take("equal") ? fatal(`Expected \`=\`.`) :
      di(expression(), rhs =>
      !tk.take("in") ? fatal(`Expected \`in\`.`) :
      di(expression(), body =>
      ({ kind: "let", isRec: true, name: i[1], rhs, body })))) :
  di(tk.take("literal"), c => c ?
    () =>
      ({ kind: "lit", value: JSON.parse(c[1]) }) :
  di(tk.take("identifier"), r => r ?
    () =>
      ({ kind: "var", name: r[1] }) :
  null)),
access_rhs: (x: Term) => Term = x =>
  tk.take("dot") ?
    di(tk.take("identifier"), i =>
    i ? access_rhs({ kind: "sel", receiver: x, fieldName: i[1] }) :
    fatal("Expected a subscript.")) :
  x,
try_access = () =>
  di(try_primary(), up =>
  !up ? up :
  () => di(up(), access_rhs)),
access = () =>
  di(try_access(), up =>
  up === null ? fatal("Expected a term.") :
  up()),
juxt_rhs: (x: Term) => Term = x =>
  di(try_access(), up =>
  !up ? x :
  di(up(), y =>
  juxt_rhs({ kind: "app", lhs: x, rhs: y }))),
juxt = () => di(access(), juxt_rhs),
expression = juxt,
all = () =>
  di(expression(), e =>
  !tk.take("eof") ? fatal(`Expected end of file.`) :
  e)
return all() }

const parens = (x: boolean, c: string) => x ? `(${c})` : c

// const print_term: (e: Term) => string = e => {
// const qq: (a: [string, Term][], r: string[]) => string = (a, r) =>
//   !a[0] ? `{ ${r.join(', ')} }` :
//   qq(a.slice(1), [...r, `${a[0][0]}: ${s(a[0][1], 0, true)}`])
// const s: (e: Term, pr: number, rm: boolean) => string = (e, pr, rm) => visit_term({
//   lit: ({ value }) => `${value}`,
//   var: ({ name }) => name,
//   lam: ({ name, body }) =>
//     parens(!rm, `λ${name}.${s(body, 0, true)}`),
//   app: ({ lhs, rhs }) =>
//     parens(pr > 1, `${s(lhs, 0, false)} ${s(rhs, 1, pr > 1 || rm)}`),
//   rcd: ({ fields }) => qq(fields, []),
//   sel: ({ receiver, fieldName }) => `${s(receiver, 1, false)}.${fieldName}`,
//   let: ({ name, rhs, body }) => `let ${name} = ${s(rhs, 0, true)} in ${s(body, 0, true)}` })(e)
// return s(e, 0, true) }

const print_simple_type: (e: SimpleType) => string = e => {
const qq: (a: [string, SimpleType][], r: string[]) => string = (a, r) =>
  !a[0] ? `{ ${r.join(', ')} }` :
  qq(a.slice(1), [...r, `${a[0][0]}: ${s(a[0][1], 0)}`])
const s: (e: SimpleType, pr: number) => string = (e, pr) => visit_simple_type({
  variable: ({}) => "<variable state>",
  primitive: ({ name }) => name,
  function: ({ lhs, rhs }) =>
    parens(pr > 0, `${s(lhs, 1)} -> ${s(rhs, 0)}`),
  record: ({ fields }) => qq(fields, []) })(e)
return s(e, 0) }

const print_typ: (e: Typ) => string = e => {
const qq: (a: [string, Typ][], r: string[]) => string = (a, r) =>
  !a[0] ? `{ ${r.join(', ')} }` :
  qq(a.slice(1), [...r, `${a[0][0]}: ${s(a[0][1], 0)}`])
const s: (e: Typ, pr: number) => string = (e, pr) => visit_typ({
  top: () => '⊤',
  bot: () => '⊥',
  union: ({ lhs, rhs }) =>
    parens(pr > 2, `${s(lhs, 2)} ⊓ ${s(rhs, 3)}`),
  inter: ({ lhs, rhs }) =>
    parens(pr > 1, `${s(lhs, 1)} ⊔ ${s(rhs, 2)}`),
  function: ({ lhs, rhs }) =>
    parens(pr > 0, `${s(lhs, 1)} -> ${s(rhs, 0)}`),
  record: ({ fields }) => qq(fields, []),
  recursive: ({ name }) => name,
  variable: ({ name }) => name,
  primitive: ({ name }) => name })(e)
return s(e, 0) }

function typeTerm(term: Term, ctx: Ctx): SimpleType {
  if (term.kind === "lit") {
    return { kind: "primitive", name: "int" } }
  else if (term.kind === "var") {
    const u = ctx[term.name]
    if (!u) { err(`not found: ${term.name}`) }
    return u }
  else if (term.kind === "rcd") {
    return { kind: "record", fields: term.fields.map(([n, t]) => [n, typeTerm(t, ctx)]) } }
  else if (term.kind === "lam") {
    const param = freshVar()
    return { kind: "function", lhs: param, rhs: typeTerm(term.body, { ...ctx, [term.name]: param}) } }
  else if (term.kind === "app") {
    const res = freshVar()
    constrain(typeTerm(term.lhs, ctx), { kind: "function", lhs: typeTerm(term.rhs, ctx), rhs: res })
    return res }
  else if (term.kind === "sel") {
    const res = freshVar()
    constrain(typeTerm(term.receiver, ctx), { kind: "record", fields: [[term.fieldName, res]] })
    return res }
  else {
    const res = freshVar()
    constrain(typeTerm(term.rhs, ctx), res)
    return typeTerm(term.rhs, { ...ctx, [term.name]: res }) } }

// const cache: Map<SimpleType, Set<SimpleType>> = new Map()
// function cache_contains(lhs: SimpleType, rhs: SimpleType): boolean {
// return cache.has(lhs) && (cache.get(lhs) as Set<SimpleType>).has(rhs) }

function constrain(lhs: SimpleType, rhs: SimpleType): void {
  // if (cache_contains(lhs, rhs)) { }
  if (lhs.kind === "primitive" && rhs.kind === "primitive" && lhs.name === rhs.name) { }
  else if (lhs.kind === "function" && rhs.kind === "function") {
    constrain(rhs.lhs, lhs.lhs); constrain(lhs.rhs, rhs.rhs) }
  else if (lhs.kind === "record" && rhs.kind === "record") {
    for (const [n1, t1] of rhs.fields) {
      const u = lhs.fields.find(x => x[0] === n1)
      if (!u) {
        err(`missing field: ${n1} in ${lhs}`) }
      else {
        constrain(u[1], t1) } } }
  else if (lhs.kind === "variable") {
    lhs.st.upperBounds = [...lhs.st.upperBounds, rhs]
    for (const z of lhs.st.lowerBounds) {
      constrain(z, rhs) } }
  else if (rhs.kind === "variable") {
    rhs.st.upperBounds = [...rhs.st.upperBounds, rhs]
    for (const z of rhs.st.lowerBounds) {
      constrain(z, rhs) } }
  else {
    err(`cannot constrain: ${print_simple_type(lhs)} <: ${print_simple_type(rhs)}`) }
}

const freshName: () => string = (() => {
let n = 0
return () => `__${n++}` })()

function freshVar(): SimpleTypeVariable {
  return { kind: "variable", st: { lowerBounds: [], upperBounds: [] } } }

function err(msg: string): never {
  throw new Error(`type error: ${msg}`) }

type RecursionMap = { polar_true: Map<VariableState, TypVariable>, polar_false: Map<VariableState, TypVariable> }
type ProcedureSet = { polar_true: Set<VariableState>, polar_false: Set<VariableState> }
function coalesceType(ty: SimpleType): Typ {
  const recursive: RecursionMap =
    { polar_true: new Map(), polar_false: new Map() }
  function go(ty: SimpleType, polar: boolean, inProcess: ProcedureSet): Typ {
    if (ty.kind === "primitive") {
      return { kind: "primitive", name: ty.name } }
    else if (ty.kind === "function") {
      return { kind: "function", lhs: go(ty.lhs, !polar, inProcess), rhs: go(ty.rhs, polar, inProcess) } }
    else if (ty.kind === "record") {
      return { kind: "record", fields: ty.fields.map(nt => [nt[0], go(nt[1], polar, inProcess)]) } }
    else {
      if (inProcess[polar ? "polar_true" : "polar_false"].has(ty.st)) {
        const u = recursive[polar ? "polar_true" : "polar_false"].get(ty.st)
        if (!u) {
          const v: Typ = { kind: "variable", name: freshName() }
          recursive[polar ? "polar_true" : "polar_false"].set(ty.st, v)
          return v }
        else {
          return u } }
      else {
        const bounds = polar ? ty.st.lowerBounds : ty.st.upperBounds
        const boundTypes = bounds.map(x => go(x, polar,
          polar ?
            { polar_true: new Set([...inProcess.polar_true, ty.st]), polar_false: inProcess.polar_false } :
            { polar_true: inProcess.polar_true, polar_false:  new Set([...inProcess.polar_false, ty.st]) }))
        const mrg = polar ? "union" : "inter"
        let res: Typ = { kind: "variable", name: freshName() }
        for (const e of boundTypes) {
          res = { kind: mrg, lhs: res, rhs: e } }
        const u = recursive[polar ? "polar_true" : "polar_false"].get(ty.st)
        if (u) {
          return { kind: "recursive", name: freshName(), body: res } }
        else {
          return res } } } }
  return go(ty, true, { polar_true: new Set(), polar_false: new Set() }) }

console.log(print_typ(coalesceType(typeTerm(read_term(tokenizer(scanner('\\x.x.a', ''))), {}))))