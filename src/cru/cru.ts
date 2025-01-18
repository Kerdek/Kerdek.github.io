import { async_homproc } from '../run.js'
import { Pos, Scanner } from "../scanner.js"
import { stam, STAMStem } from '../stam.js'

export type App = ["app", Graph, Graph]
export type Abs = ["abs", string, Graph]
export type Var = ["var", string]
export type Lit = ["lit", Value]
export type Rec = ["rec", RecordSyntax]
export type Lst = ["lst", ListSyntax]
export type Acs = ["acs", Graph, Graph]
export type Mod = ["mod", Module, Graph]
export type Sav = ["sav", Record, Graph]
export type Shr = ["shr", Graph, Value?]

export type Graph = Abs | Lit | Shr | App | Var | Mod | Acs | Rec | Lst | Sav

export type Kind = Graph[0]

export type EvaluateBranch = STAMStem<[Graph, Record], Value>
export type Func = (e: Graph) => EvaluateBranch
export type Value = string | number | boolean | null | undefined | void | Record | List | Func
export type RecordSyntax = ([false, Graph, Graph] | [true, Graph])[]
export type ListSyntax = [boolean, Graph][]
export type List = Shr[]
export type Record = { [i: string]: Shr }
export type Builtins = { [i: string]: Value }
export type Definition = [string, Graph]
export type Module = Definition[]
export type Print = (e: Graph) => string
export type Bubble = (e: Sav) => Graph
export type Evaluate = (e: Graph) => Value

type Sorts = { [i in Kind]: [i, ...Rest<i, Graph>] }
type Rest<i, Graph> = Graph extends [i, ...infer R] ? R : never
type Read = (src: Tokenizer) => Promise<Graph>
type Fatal = (msg: string) => never

type Make = <K extends Graph>(...x: K) => K
type Visit = <K extends Kind, R, A extends any[]>(o: { [i in K]: (e: Sorts[i], ...a: A) => R }) => (e: Sorts[K], ...a: A) => R
type Assign = <K extends Graph>(e: Graph, x: K) => K

export const make: Make = (...x) => x
export const visit: Visit = o => (e, ...a) => (f => f(e, ...a))(o[e[0]])

export const assign: Assign = (e, x) => {
  let i = 0
  for (; i < x.length; i++) {
    e[i] = x[i] as any }
  for (; i < e.length; i++) {
    delete e[i] }
  return e as any }


export type NonEOFTokenKind =
  "lparen" | "rparen" | "lbrace" | "rbrace" | "dot" | "dots" | "dotbracket" | "lbracket" | "rbracket" | "rsolidus" | "comma" | "equal" |
  "arrow" | "hash" | "colon" | "dollar" | "where" | "let" | "in" | "identifier" | "literal"
export type Token =
  [NonEOFTokenKind, string] |
  ["eof"]

export type TokenKind = Token[0]
type TokenSorts = { [K in TokenKind]: [K, string] }

export type Tokenizer = {
  unget(s: string) : void
  pos(): Pos
  unpos(p: Pos): void
  take<K extends TokenKind>(k: K): TokenSorts[K] | undefined }

export function tokenizer(s: Scanner): Tokenizer {
  let t!: Token

  function fatal(msg: string): never {
    throw new Error(`(${s.pos()[0]}:${s.pos()[1]}:${s.pos()[2]}): tokenizer: ${msg}`) }

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
    if (k(/^{/)) { t = ["lbrace", "{"]; return }
    if (k(/^}/)) { t = ["rbrace", "}"]; return }
    if (k(/^\[/)) { t = ["lbracket", "["]; return }
    if (k(/^\]/)) { t = ["rbracket", "]"]; return }
    if (k(/^:/)) { t = ["colon", ":"]; return }
    if (k(/^\.\[/)) { t = ["dotbracket", ".["]; return }
    if (k(/^\.\.\./)) { t = ["dots", "..."]; return }
    if (k(/^\./)) { t = ["dot", "."]; return }
    if (k(/^\\/)) { t = ["rsolidus", "\\"]; return }
    if (k(/^=/)) { t = ["equal", "="]; return }
    if (k(/^,/)) { t = ["comma", ","]; return }
    if (k(/^->/)) { t = ["arrow", "->"]; return }
    if (k(/^#/)) { t = ["hash", "#"]; return }
    if (k(/^\$/)) { t = ["dollar", "$"]; return }
    let r = k(/^("([^"\\]|\\.)*($|")|[+-]?(?:\d+(?:\.\d+)?)(?:[eE][+-]?\d+)?|false|true|null|undefined)/)
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

const includes: { [i: string]: Shr } = {}

export const read: Read = tk => async_homproc((call, cc, ret) => {
type Branch = ReturnType<typeof ret>
const
fatal: Fatal = m => { throw new Error(`(${tk.pos()[0]}:${tk.pos()[1]}:${tk.pos()[2]}): parser: ${m}`) },
include: () => Promise<Branch> = async () => {
  let ru = tk.take("literal")
  if (ru === undefined || typeof ru[1] !== "string") {
    fatal("Expected a string.") }
  const wp: Pos = tk.pos()
  const url = new URL(wp[0])
  const dirname = url.href.substring(0, url.href.lastIndexOf('/'))
  const r = new URL(dirname + "/" + JSON.parse(ru[1])).href
  const m = includes[r]
  if (m) {
    return ret(m) }
    let res = await fetch(`${r}`);
  if (!res.ok) {
    fatal(`HTTP status ${res.status} while requesting \`./${res.url}\`.`) }
  tk.unget(`${await res.text()})`)
  tk.unpos([r, 1, 1])
  return call(expression, async e => {
    tk.take("rparen")
    tk.unpos(wp)
    const m: Shr = make("shr", e)
    includes[r] = m
    return ret(m) }) },
lst_elems: (l: ListSyntax) => () => Promise<Branch> = l => async () =>
  await di(tk.take("dots"), async is_splat =>
  call(expression, async e =>
  tk.take("rbracket") ? ret(make("lst", [ ...l, [is_splat ? true : false, e] ])) :
  tk.take("comma") ? cc(lst_elems([ ...l, [is_splat ? true : false, e] ])) :
  fatal(`Expected \`,\` or \`]\`.`))),
rec_defs: (e: RecordSyntax) => () => Promise<Branch> = o => async() =>
  tk.take("dots") ?
    call(expression, async e =>
    await di(() => [...o, [true, e]] as RecordSyntax, async r =>
    tk.take("rbrace") ? ret(make("rec", r())) :
    tk.take("comma") ? cc(rec_defs(r())) :
    fatal(`Expected \`,\` or \`}\`.`))) :
  tk.take("lbracket") ?
    call(expression, async i =>
    !tk.take("rbracket") ? fatal(`Expected \`]\`.`) :
    call(parameters("colon"), async y =>
    await di(() => [...o, [false, i, y]] as RecordSyntax, async r =>
    tk.take("rbrace") ? ret(make("rec", r())) :
    tk.take("comma") ? cc(rec_defs(r())) :
    fatal(`Expected \`,\` or \`}\`.`)))) :
  await di(tk.take("identifier"), async i =>
  !i ? fatal(`Expected \`...\`, \`[\`, or an identifier.`) :
  await di(() => [...o, [false, make("lit", i[1]), make("var", i[1])]] as RecordSyntax, async r =>
  tk.take("rbrace") ? ret(make("rec", r())) :
  tk.take("comma") ? cc(rec_defs(r())) :
  call(parameters("colon"), async y =>
  await di(() => [...o, [false, make("lit", i[1]), y]] as RecordSyntax, async r =>
  tk.take("rbrace") ? ret(make("rec", r())) :
  tk.take("comma") ? cc(rec_defs(r())) :
  fatal(`Expected \`,\` or \`}\`.`))))),
let_defs: (m: Module) => () => Promise<Branch> = m => async () =>
  await di(tk.take("identifier"), async i =>
  !i ? fatal(`Expected an identifier.`) :
  call(parameters("equal"), async y =>
  tk.take("in") ? call(dollar, async x => ret(make("mod", [...m, [i[1], y]], x))) :
  tk.take("comma") ? cc(let_defs([...m, [i[1], y]])) :
  fatal(`Expected \`,\` or \`in\`.`))),
parameters: (k: TokenKind) => () => Promise<Branch> = k => async () =>
  tk.take(k) ? cc(expression) :
  await di(tk.take("identifier"), async i =>
  i ? call(parameters(k), async dx => ret(make("abs", i[1], dx))) :
  fatal(`Expected token kind \`${k}\`.`)),
try_primary: () => Promise<(() => Promise<Branch>) | null> = async () =>
  tk.take("hash") ? include :
  tk.take("lbracket") ?
    async () =>
      tk.take("rbracket") ? ret(make("lst", [])) :
      cc(lst_elems([])):
  tk.take("lbrace") ?
    async () =>
      tk.take("rbrace") ? ret(make("rec", [])) :
      cc(rec_defs([])) :
  tk.take("rsolidus") ?
    parameters("arrow") :
  tk.take("lparen") ?
    async () =>
      call(expression, async x =>
      tk.take("rparen") ? ret(x) :
      fatal(`Expected \`)\`.`)) :
  tk.take("let") ?
    async () =>
      tk.take("in") ? cc(dollar) :
      cc(let_defs([])) :
  await di(tk.take("literal"), async c =>
  c ? async () => ret(make("lit",
    c[1] === "undefined" ? undefined :
    JSON.parse(c[1]))) :
  await di(tk.take("identifier"), async r =>
  r ? async () => ret(make("var", r[1])) : null)),
access_rhs: (e: Graph) => Promise<Branch> = async x =>
  tk.take("dot") ?
    await di(tk.take("identifier"), async i =>
    i ? access_rhs(make("acs", x, make("lit", i[1]))) :
    await di(tk.take("literal"), async i =>
    i ? access_rhs(make("acs", x, make("lit", i[1]))) :
    fatal("Expected a subscript."))) :
  tk.take("dotbracket") ?
    call(expression, async i =>
    !tk.take("rbracket") ? fatal(`Expected \`]\`.`) :
    access_rhs(make("acs", x, i))) :
  ret(x),
try_access: () => Promise<(() => Promise<Branch>) | null> = async () =>
  await di(await try_primary(), async up =>
  up === null ? null :
  async () => call(up, access_rhs)),
access: () => Promise<Branch> = async () =>
  await di(await try_access(), async up =>
  up === null ? fatal("Expected a term.") :
  cc(up)),
juxt_rhs: (e: Graph) => Promise<Branch> = async x =>
  await di(await try_access(), async up =>
  up === null ? ret(x) :
  call(up, async y =>
  juxt_rhs(make("app", x, y)))),
juxt: () => Promise<Branch> = async () => call(access, juxt_rhs),
dollar: () => Promise<Branch> = async () =>
  call(juxt, async x =>
  tk.take("dollar") ?
    call(dollar, async y =>
    ret(make("app", x, y))) :
  ret(x)),
where_defs: (e: Mod) => () => Promise<Branch> = ([, m, x]) => async () =>
  await di(tk.take("identifier"), async i =>
  !i ? fatal(`Expected an identifier.`) :
  call(parameters("equal"), async y =>
  tk.take("rparen") ? ret(make("mod", [...m, [i[1], y]], x)) :
  tk.take("comma") ? cc(where_defs(make("mod", [...m, [i[1], y]], x))) :
  fatal(`Expected \`)\` or \`,\`.`))),
where_clause: (e: Graph) => () => Promise<Branch> = x => async () =>
  di(make("mod", [], x), r =>
  tk.take("rparen") ? ret(r) :
  cc(where_defs(r))),
where_seq: (x: Graph) => Promise<Branch> = async x =>
  tk.take("where") ?
    !tk.take("lparen") ? fatal(`Expected \`(\`.`) :
    call(where_clause(x), where_seq) :
  ret(x),
where: () => Promise<Branch> = async () => call(dollar, where_seq),
expression = where,
all: () => Promise<Branch> = async () =>
  call(expression, async e =>
  !tk.take("eof") ? fatal(`Expected end of file.`) :
  ret(e))
return all })

export const print: Print = visit({
mod: () => `<module>`,
app: () => `<application>`,
abs: () => `<function>`,
var: () => `<variable>`,
acs: () => `<access>`,
lit: ([, c]) =>
  Array.isArray(c) ? `[${c.map(print).join(', ')}]` :
  c === null ? `null` :
  typeof c === "object" ? `{ ${Object.keys(c).map(k => `${k}: ${print(c[k] as Graph)}`).join(', ')} }` :
  typeof c === "undefined" ? "undefined" :
  JSON.stringify(c),
sav: () => `<save>`,
shr: () => `<shared>`,
lst: () => `<list>`,
rec: () => `<record>` })

export const print_value: (e: Value) => string = e =>
typeof e === "function" ? "<function>" :
Array.isArray(e) ? `[${e.map(print).join(', ')}]` :
e === null ? `null` :
typeof e === "object" ? `{ ${Object.keys(e).map(k => `${e}: ${print(e[k] as Graph)}`).join(', ')} }` :
typeof e === "undefined" ? "undefined" :
JSON.stringify(e)

export const get_builtin: Builtins = await (async () => {
const nullary: (op: any) => Value = op => op
const unary: (op: (x: any) => any) => Value = op => r => (rec, _cc, ret) =>
  rec([r, {}], dx =>
  ret(op(dx)))
const binary: (op: (x: any, y: any) => any) => Value = op => r => (rec, _cc, ret) =>
  rec([r, {}], dx =>
  ret(unary(dy => op(dx, dy))))
const ternary: (op: (x: any, y: any, z: any) => any) => Value = op => r => (rec, _cc, ret) =>
  rec([r, {}], dx =>
  ret(binary((dy, dz) => op(dx, dy, dz))))
return {
  __builtin_typeof: r => (rec, _rc, ret) => rec([r, {}], dx => ret(Array.isArray(dx) ? "tuple" : typeof dx === "object" ? "record" : typeof dx)),
  __builtin_length: unary(x => x.length),
  __builtin_keys: unary(x => Object.keys(x).map(x => make("shr", make("lit", x), x) )),
  __builtin_slice: ternary((x, y, z) => x.slice(y, z)),
  __builtin_rec: r => (_rec, cc, _ret) => (e => (e[2] = e, cc([e, {}])))(make("app", r, undefined as unknown as Graph)),
  __builtin_if: r => (rec, _cc, ret) => rec([r, {}], dx => ret(a => (_rec, _cc, ret) => ret(b => (_rec, cc, _ret) => cc([dx ? a : b, {}])))),
  __builtin_add: binary((a, b) => a + b),
  __builtin_sub: binary((a, b) => a - b),
  __builtin_mul: binary((a, b) => a * b),
  __builtin_div: binary((a, b) => a / b),
  __builtin_eq: binary((a, b) => a === b),
  __builtin_neq: binary((a, b) => a !== b),
  __builtin_gt: binary((a, b) => a > b),
  __builtin_lt: binary((a, b) => a < b),
  __builtin_ge: binary((a, b) => a >= b),
  __builtin_le: binary((a, b) => a <= b),
  __builtin_elem: binary((a, b) => a[b]),
  __builtin_pi: nullary(Math.PI),
  __builtin_sqrt: unary(Math.sqrt),
  __builtin_log: unary(Math.log),
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
  __builtin_shead: unary(x => x[0]),
  __builtin_stail: unary(x => x.substring(1)),
  __builtin_stringify: unary(JSON.stringify),
  __builtin_document: nullary(document),
  __builtin_console: nullary(console),
  __builtin_WebSocket: nullary(WebSocket) } })()

const fatal: (m: string) => never = m => { throw new Error(m) }

export const evaluate = stam<[Graph, Record], Value>((rec, rc, ret) => {
type Branch = ReturnType<typeof ret>
const r = (a: RecordSyntax, d: Record, o: Record): Branch =>
  di(a[0], e =>
  e === undefined ? ret(d) :
  e[0] ?
    rec([e[1], o], de =>
    typeof de !== "object" || de === null || Array.isArray(de) ? (() => { throw new Error("Expected a record.") })() :
    r(a.slice(1), { ...d, ...de }, o)):
  rec([e[1], o], di =>
  typeof di !== "string" ? (() => { throw new Error("Expected a string.") })() :
  r(a.slice(1), { ...d, [di]: make("shr", make("sav", o, e[2])) }, o)))
const l = (a: ListSyntax, d: List, o: Record): Branch =>
  di(a[0], e =>
  e === undefined ? ret(d) :
  e[0] ?
    rec([e[1], o], de =>
    !Array.isArray(de) ? (() => { throw new Error("Expected a list.") })() :
    l(a.slice(1), [...d, ...de], o)) :
  l(a.slice(1), [...d, make("shr", make("sav", o, e[1]))], o))
const table: (e: Graph, o: Record) => Branch = visit({
  sav: ([, i, x], o) => rc([x, { ...o, ...i }]),
  mod: (e, o) => {
    const op: Record = {}
    for (const def of e[1]) {
      op[def[0]] = make("shr", make("sav", o, make("sav", op, def[1]))) }
    return rc([make("sav", op, e[2]), o]) },
  app: (e, o) => rec([e[1], o], dx =>
    typeof dx !== "function" ? fatal(`Expected a function.`) :
    dx(make("sav", o, e[2]))(rec, rc, ret)),
  shr: (e, _o) => 2 in e ? ret(e[2]) : rec([e[1], {}], dx => (e[2] = dx, ret(dx))),
  var: (e, o) =>
    (r => r ? rc([r, {}]) :
    (r => r !== undefined ? ret(r) :
    fatal(`Undefined reference to \`${e[1]}\`.`))(get_builtin[e[1]]))(o[e[1]]),
  acs: ([, x, y], o) =>
    rec([x, o], dx =>
    rec([y, o], dy =>
    typeof dx === "object" && dx !== null && !Array.isArray(dx) ?
      typeof dy !== "string" ? (() => { throw new Error(`Expected a string instead of \`${print_value(dy)}\` on rhs of subscript with \`${print_value(dx)}\`.`)})() :
      di(dx[dy], j =>
      j === undefined ? (() => { throw new Error(`\`${print(y)}\` (aka \`${dy}\`) is not a property of \`${print(x)}\` (aka \`${print_value(dx)}\`).`)})() :
      rc([make("shr", j), {}])) :
    Array.isArray(dx) ?
      typeof dy !== "number" ? (() => { throw new Error(`Expected a number instead of \`${print_value(dy)}\` on rhs of subscript with \`${print_value(dx)}\`.`)})() :
      di(dx[dy], j =>
      j === undefined ? (() => { throw new Error(`\`${print(y)}\` (aka \`${dy}\`) is not a property of \`${print(x)}\` (aka \`${print_value(dx)}\`).`)})() :
      rc([make("shr", j), {}])) :
    typeof dx === "string" ?
      typeof dy !== "number" ? (() => { throw new Error(`Expected a number instead of \`${print_value(dy)}\` on rhs of subscript with \`${print_value(dx)}\`.`)})() :
      di(dx[dy], j =>
      j === undefined ? (() => { throw new Error(`\`${print(y)}\` (aka \`${dy}\`) is not a property of \`${print(x)}\` (aka \`${print_value(dx)}\`).`)})() :
      rc([make("lit", j), {}])) :
    (() => { throw new Error(`Expected a record instead of \`${print_value(dx)}\` on lhs of subscript with \`${print_value(dy)}\`.`)})())),
  rec: ([, x], o) => r(x, {}, o),
  lst: ([, x], o) => l(x, [], o),
  abs: (e, o) => ret(a => (_rec, cc, _ret) => cc([e[2], { ...o, [e[1]]: make("shr", a) }])),
  lit: (e, _o) => ret(e[1]) })
return ([e, o]) => () => table(e, o) })