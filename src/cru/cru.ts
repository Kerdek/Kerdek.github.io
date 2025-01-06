import { Branch, jmp, Process, homproc, AsyncProcess, AsyncBranch, async_homproc } from '../run.js'
import { Pos, Scanner } from "../scanner.js"

type App = ["app", Graph, Graph]
type Abs = ["abs", string, Graph]
type Ref = ["ref", string]
type Lit = ["lit", string | number | boolean | Array<any> | Object | null | void | undefined]
type Whr = ["whr", Module, Graph]
type Sav = ["sav", Save, Graph]
type Bar = ["bar", [Graph]]
type Blt = ["blt", BuiltinFunction]

export type Normal = Abs | Lit | Blt
export type Term = Normal | Bar | App | Ref | Whr
export type Graph = Term | Sav

export type Kind = Graph[0]

export type Save = { [i: string]: [Graph] }
export type Builtins = { [i: string]: Normal }
export type Definition = [string, Graph]
export type Module = Definition[]
export type BuiltinFunction = (call: (u: Process, v: (x: Normal) => Branch) => Branch, ret: (x: Normal) => Branch, s: GraphProcess, r: Graph) => Branch
export type Print = (e: Graph) => string
export type Bubble = (e: Sav) => Term
export type Evaluate = (e: Term) => Normal

type Sorts = { [i in Kind]: [i, ...Rest<i, Graph>] }
type Rest<i, Graph> = Graph extends [i, ...infer R] ? R : never
type Make = <K extends Graph>(...x: K) => K
type Assign = <K extends Graph>(e: Graph, x: K) => K
type Visit = <K extends Kind>(o: { [i in K]: (e: Sorts[i]) => Branch }) => <I extends K>(e: Sorts[I]) => () => Branch
type Read = (src: Tokenizer) => Promise<Term>
type Fatal = (msg: string) => never
type AsyncTermAsyncBranch = (e: Term) => Promise<AsyncBranch>
type ModuleAsyncProcess = (e: Module) => AsyncProcess
type WhrAsyncProcess = (e: Whr) => AsyncProcess
type PunctuatorAsyncProcess = (k: TokenKind) => AsyncProcess
type SavProcess = (e: Sav) => Process
type ModuleProcess = (m: Module) => Process
type TermAsyncProcess = (e: Term) => AsyncProcess
type GraphProcess = (e: Graph) => Process

export const assign: Assign = (e, x) => {
  let i = 0
  for (; i < x.length; i++) {
    e[i] = x[i] as any }
  for (; i < e.length; i++) {
    delete e[i] }
  return e as any }

export const make: Make = (...x) => x
export const visit: Visit = o => e => (f => () => f(e))(o[e[0]])

export type NonEOFTokenKind =
  "lparen" | "rparen" | "rsolidus" | "comma" | "equal" |
  "arrow" | "hash" | "colon" | "dollar" | "where" | "let" | "in" | "identifier" | "literal"
export type Token =
  [NonEOFTokenKind, string] |
  ["eof"]

export type TokenKind = Token[0]
type TokenSorts = { [i in TokenKind]: [i, ...Rest<i, Token>] }

export type Tokenizer = {
  unget(s: string) : void
  pos(): Pos
  unpos(p: Pos): void
  take<K extends TokenKind>(k: K): TokenSorts[K] | undefined }

export function tokenizer(s: Scanner): Tokenizer {
  let t!: Token

  function fatal(msg: string): never {
    throw new Error(`(${s.pos()}): tokenizer: ${msg}`) }

  function k(t: RegExp) {
    const matches = s.get().match(t);
    if (matches === null) {
      return null; }
    return matches[0]; }

  function pos(): Pos {
    return s.pos() }

  function take<K extends TokenKind>(k: K): TokenSorts[K] | undefined {
    if (t[0] === k) {
      const r = t as TokenSorts[K]
      skip()
      return r }
    return undefined }

  function ws(): void {
    const ws = k(/^(\s|\/\/([^\n\\]|\\.)*?(\n|$)|\/\*([^\*\\]|\\.|\*[^\/])*?(\*\/|$))*/)
    if (ws) {
      s.skip(ws.length) }  }

  function skip(): void {
    if (t[0] === "eof") {
      return }
    s.skip(t[1].length)
    ws()
    classify() }

  function classify(): void {
    if (s.get().length === 0) { t = ["eof"]; return }
    if (k(/^\(/)) { t = ["lparen", "("]; return }
    if (k(/^\)/)) { t = ["rparen", ")"]; return }
    if (k(/^\\/)) { t = ["rsolidus", "\\"]; return }
    if (k(/^=/)) { t = ["equal", "="]; return }
    if (k(/^,/)) { t = ["comma", ","]; return }
    if (k(/^->/)) { t = ["arrow", "->"]; return }
    if (k(/^#/)) { t = ["hash", "#"]; return }
    if (k(/^\$/)) { t = ["dollar", "$"]; return }
    let r = k(/^("([^"\\]|\\.)*($|")|[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?|false|true|void)/)
    if (r) { t = ["literal", r]; return }
    r = k(/^[A-Za-z_][A-Za-z0-9_]*/)
    if (r === "where") { t = ["where", "where"]; return }
    if (r === "let") { t = ["let", "let"]; return }
    if (r === "in") { t = ["in", "in"]; return }
    if (r) { t = ["identifier", r]; return }
    fatal(`Unrecognized character sequence.`) }

  function unget(text: string): void {
    s.unget(text)
    ws()
    classify() }

  function unpos(p: Pos): void {
    s.unpos(p) }

  ws()
  classify()
  return { unget, pos, take, unpos } }

const di: <X, Y, F extends (x: X) => Y>(x: X, f: F) => Y = (x, f) => f(x)

export const read: Read = tk => async_homproc((call, ret) => {
const
fatal: Fatal = m => { throw new Error(`(${tk.pos()}): parser: ${m}`) },
includes: { [i: string]: [Graph] } = {},
include: AsyncProcess = async () => {
  let ru = tk.take("literal")
  if (ru === undefined || typeof ru[1] !== "string") {
    fatal("Expected a string.") }
  const r = JSON.parse(ru[1])
  const m = includes[r]
  if (m) {
    return ret(make("bar", m)) }
  let res = await fetch(`./${r}`);
  if (!res.ok) {
    fatal(`HTTP status ${res.status} while requesting \`./${res.url}\`.`) }
  tk.unget(`${await res.text()})`)
  const wp: Pos = tk.pos()
  tk.unpos([r, 1, 1])
  return call(expression, async e => {
    tk.take("rparen")
    tk.unpos(wp)
    const m: [Graph] = [e]
    includes[r] = m
    return ret(make("bar", m)) }) },
let_defs: ModuleAsyncProcess = m => async () =>
  di(tk.take("identifier"), i =>
  !i ? fatal(`Expected an identifier.`) :
  call(parameters("equal"), async y =>
  tk.take("in") ?
    call(expression, async x =>
    ret(make("whr", [...m, [i[1], y]], x))) :
  tk.take("comma") ? jmp(let_defs([...m, [i[1], y]])) :
  fatal(`Expected \`)\` or \`,\`.`))),
parameters: PunctuatorAsyncProcess = k => async () =>
  tk.take(k) ? jmp(expression) :
  di(tk.take("identifier"), i =>
  i ? call(parameters(k), async dx => ret(make("abs", i[1], dx))) :
  fatal(`Expected token kind \`${k}\`.`)),
try_primary: () => Promise<AsyncProcess | null> = async () =>
  tk.take("hash") ? include :
  tk.take("rsolidus") ? async () =>
    jmp(parameters("arrow")) :
  tk.take("lparen") ? async () =>
    call(expression, async x =>
    tk.take("rparen") ? ret(x) :
    fatal(`Expected \`)\`.`)) :
  tk.take("let") ? async () =>
     jmp(let_defs([])) :
  di(tk.take("literal"), c => c ? async () =>
    ret(make("lit", c[1] === "void" ? void 0 : JSON.parse(c[1]))) :
  di(tk.take("identifier"), r => r ? async () =>
    ret(make("ref", r[1])) : null)),
primary: AsyncProcess = async () =>
  await di(await try_primary(), async up =>
  up === null ? fatal("Expected a term.") :
  jmp(up)),
juxt_rhs: AsyncTermAsyncBranch = async x =>
  await di(await try_primary(), async up =>
  up === null ? ret(x) :
  call(up, y =>
  juxt_rhs(make("app", x, y)))),
juxt: AsyncProcess = async () => call(primary, juxt_rhs),
dollar: AsyncProcess = async () =>
  call(juxt, async x =>
  tk.take("dollar") ?
    call(dollar, async y =>
    ret(make("app", x, y))) :
  ret(x)),
where_defs: WhrAsyncProcess = ([, m, x]) => async () =>
  di(tk.take("identifier"), i =>
  !i ? fatal(`Expected an identifier.`) :
  call(parameters("equal"), async y =>
  tk.take("rparen") ? ret(make("whr", [...m, [i[1], y]], x)) :
  tk.take("comma") ? jmp(where_defs(make("whr", [...m, [i[1], y]], x))) :
  fatal(`Expected \`)\` or \`,\`.`))),
where_clause: TermAsyncProcess = x => async () =>
  di(make("whr", [], x), r =>
  tk.take("rparen") ? ret(r) :
  jmp(where_defs(r))),
where_seq: AsyncTermAsyncBranch = async x =>
  tk.take("where") ?
    !tk.take("lparen") ? fatal(`Expected \`(\`.`) :
    call(where_clause(x), where_seq) :
  ret(x),
where: AsyncProcess = async () => call(dollar, where_seq),
expression = where,
all: AsyncProcess = async () =>
  call(expression, async e =>
  !tk.take("eof") ? fatal(`Expected end of file.`) :
  ret(e))
return all })

export const print: Print = e => homproc((call, ret) => {
const
  q: GraphProcess = e => () =>
    e[0] === "abs" ? call(q(e[2]), dx => ret(`${e[1]} ${dx}`)) :
    call(s(e), dx => ret(`= ${dx}`)),
  r: ModuleProcess = m => () =>
    m[0] === undefined ? ret("") :
  (i => call(q(i[1]), dd => call(r(m.slice(1)), dr => ret(`${i[0]} ${dd}, ${dr}`))))(m[0]),
  s: GraphProcess = visit({
    whr: ([, m, y]) => call(s(y), dy => call(r(m), dm => ret(`(${dy} where (${dm.slice(0, -2)}))`))),
    app: ([, x, y]) => call(s(x), dx => call(s(y), dy => ret(`(${dx} ${dy})`))),
    abs: ([, i, x]) => call(s(x), dx => ret(`(\\${i} -> ${dx})`)),
    ref: ([, r]) => ret(r),
    lit: ([, c]) => ret(JSON.stringify(c)),
    sav: ([, , x]) => jmp(s(x)),
    bar: () => ret("{shared}"),
    blt: () => ret("{built-in function}") })
return s(e) })

export const builtins: Builtins = await (async () => {
const nullary: (op: any) => Normal = op => make("lit", op)
const unary: (op: (x: any) => any) => Normal = op => make("blt", (call, ret, s, r) =>
  call(s(r), dx =>
  ret(make("lit", op(dx[1])))))
const binary: (op: (x: any, y: any) => any) => Normal = op => make("blt", (call, ret, s, r) =>
  call(s(r), dx =>
  ret(unary(y => op(dx[1], y)))))
return {
  __builtin_rec: make("blt", (_call, _ret, s, r) => (e => (e[2] = e, jmp(s(e))))(make("app", r, undefined as unknown as Graph))),
  __builtin_if: make("blt", (call, ret, s, r) => call(s(r), dx => ret(make("abs", "y", make("abs", "z", make("ref", dx[1] ? "y" : "z")))))),
  __builtin_and: make("blt", (call, ret, s, r) => call(s(r), dx => ret(make("abs", "x", dx[1] ? make("ref", "x") : dx)))),
  __builtin_or: make("blt", (call, ret, s, r) => call(s(r), dx => ret(make("abs", "x", dx[1] ? dx : make("ref", "x"))))),
  __builtin_neg: unary(x => -x),
  __builtin_not: unary(x => !x),
  __builtin_cpl: unary(x => ~x),
  __builtin_mul: binary((a, b) => a * b),
  __builtin_div: binary((a, b) => a / b),
  __builtin_mod: binary((a, b) => a % b),
  __builtin_add: binary((a, b) => a + b),
  __builtin_sub: binary((a, b) => a - b),
  __builtin_shl: binary((a, b) => a << b),
  __builtin_shr: binary((a, b) => a >> b),
  __builtin_eq: binary((a, b) => a === b),
  __builtin_neq: binary((a, b) => a !== b),
  __builtin_gt: binary((a, b) => a > b),
  __builtin_ge: binary((a, b) => a >= b),
  __builtin_lt: binary((a, b) => a < b),
  __builtin_le: binary((a, b) => a <= b),
  __builtin_bcj: binary((a, b) => a & b),
  __builtin_bxj: binary((a, b) => a ^ b),
  __builtin_bdj: binary((a, b) => a | b),
  __builtin_floor: unary(Math.floor),
  __builtin_ceil: unary(Math.ceil),
  __builtin_pi: nullary(Math.PI),
  __builtin_sqrt: unary(Math.sqrt),
  __builtin_log: unary(Math.log),
  __builtin_pow: binary(Math.pow),
  __builtin_exp: unary(Math.exp),
  __builtin_cos: unary(Math.cos),
  __builtin_sin: unary(Math.sin),
  __builtin_tan: unary(Math.tan),
  __builtin_acos: unary(Math.acos),
  __builtin_asin: unary(Math.asin),
  __builtin_atan: unary(Math.atan),
  __builtin_atan2: binary(Math.atan2),
  __builtin_cosh: unary(Math.cosh),
  __builtin_sinh: unary(Math.sinh),
  __builtin_tanh: unary(Math.tanh),
  __builtin_acosh: unary(Math.acosh),
  __builtin_asinh: unary(Math.asinh),
  __builtin_atanh: unary(Math.atanh),
  __builtin_sempty: unary(x => x.length === 0),
  __builtin_slength: unary(x => x.length),
  __builtin_shead: unary(x => x[0]),
  __builtin_stail: unary(x => x.substring(1)),
  __builtin_sinit: unary(x => x.substring(0, x.length - 1)),
  __builtin_slast: unary(x => x[x.length - 1]),
  __builtin_jsonstringify: unary(JSON.stringify),
  __builtin_jsonparse: unary(JSON.parse),
  __builtin_document: nullary(document),
  __builtin_console: nullary(console),
  __builtin_WebSocket: nullary(WebSocket) } })()

export const bubble: Bubble = e => homproc((call, ret) => {
const s: SavProcess = e => () => call(visit({
  sav: y => call(s(y), () => jmp(s(e))),
  whr: y => {
    const o = { ...e[1] }
    for (const def of y[1]) {
      delete o[def[0]] }
    return ret(make("whr", y[1].map(d => [d[0], make("sav", o, d[1])] as Definition), make("sav", o, y[2]))) },
  app: y => ret(make("app", make("sav", e[1], y[1]), make("sav", e[1], y[2]))),
  abs: y => {
    const o = { ...e[1] }
    delete o[y[1]]
    return ret(make("abs", y[1], make("sav", o, y[2]))) },
  ref: y => {
    const u = e[1][y[1]]
    return ret(u === undefined ? y : make("bar", u)) },
  bar: ret,
  lit: ret,
  blt: ret })(e[2]), de => ret(assign(e, de)))
return s(e) })

export const evaluate: Evaluate = e => homproc((call, ret) => {
const s: GraphProcess = visit({
  sav: e => jmp(s(bubble(e))),
  whr: e => {
    const op: Save = {}
    for (const def of e[1]) {
      op[def[0]] = [make("sav", op, def[1])] }
    return jmp(s(make("sav", op, e[2]))) },
  app: e => call(s(e[1]), dx => jmp(visit({
    abs: x => jmp(s(make("sav", { [x[1]]: [e[2]] }, x[2]))),
    blt: x => x[1](call, ret, s, e[2]),
    lit: x => { throw new Error(`Literal \`${JSON.stringify(x[1])}\` cannot be applied to \`${print(e[2])}\`.`) } })(dx))),
  bar: e => call(s(e[1][0]), dx => (e[1][0] = dx, ret(dx))),
  ref: ([, i]) => di(builtins[i], r => r ? ret(r) : (() => { throw new Error(`Undefined reference to \`${i}\`.`)})()),
  abs: ret,
  blt: ret,
  lit: ret })
return s(e) })