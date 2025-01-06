import { Branch, jmp, Process, homproc } from '../run.js'
import { Pos, Scanner } from "../scanner.js"

type App = ["app", Graph, Graph]
type Abs = ["abs", string, Graph]
type Ref = ["ref", string]
type Lit = ["lit", string | number | boolean | ((x: () => Normal) => Normal)]
type Whr = ["whr", Module, Graph]
type Sav = ["sav", Definitions, Graph]
type Bar = ["bar", [Graph]]
type Blt = ["blt", BuiltinFunction]

export type Normal = Abs | Lit | Blt
export type Term = Normal | Bar | App | Ref | Whr
export type Graph = Term | Sav

export type Kind = Graph[0]

export type Definitions = { [i: string]: [Graph] }
export type Definition = [string, Graph]
export type Module = Definition[]
export type Scope = string[]
export type BuiltinFunction = (call: (u: Process, v: (x: Normal) => Branch) => Branch, ret: (x: Normal) => Branch, s: GraphProcess, r: Graph) => Branch
export type Print = (e: Graph) => string

type Sorts = { [i in Kind]: [i, ...Rest<i, Graph>] }
type Rest<i, Graph> = Graph extends [i, ...infer R] ? R : never
type Make = <K extends Graph>(...x: K) => K
type Assign = <K extends Graph>(e: Graph, x: K) => K
type Visit = <K extends Kind>(o: { [i in K]: (e: Sorts[i]) => Branch }) => <I extends K>(e: Sorts[I]) => () => Branch
type Read = (src: Tokenizer) => Term
type Fatal = (msg: string) => never
type TermBranch = (e: Term) => Branch
type ModProcess = (e: Whr) => Process
type PunctuatorProcess = (k: TokenKind) => Process
type SavProcess = (e: Sav) => Process
type ModuleProcess = (m: Module) => Process
type TermProcess = (e: Term) => Process
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

export type Token =
  ["lparen"] |
  ["rparen"] |
  ["rsolidus"] |
  ["comma"] |
  ["equal"] |
  ["equalequal", "=="] |
  ["notequal", "!="] |
  ["more", ">"] |
  ["moreequal", ">="] |
  ["less", "<"] |
  ["lessequal", "<="] |
  ["arrow"] |
  ["exclam", "!"] |
  ["tilde", "~"] |
  ["plus", "+"] |
  ["hyphen", "-"] |
  ["ast", "*"] |
  ["astast", "**"] |
  ["solidus", "/"] |
  ["percent", "%"] |
  ["lessless", "<<"] |
  ["moremore", ">>"] |
  ["amp", "&"] |
  ["pipe", "|"] |
  ["caret", "^"] |
  ["ampamp", "&&"] |
  ["pipepipe", "||"] |
  ["question", "?"] |
  ["colon"] |
  ["dollar"] |
  ["where"] |
  ["identifier", string] |
  ["literal", string | number | boolean] |
  ["eof"]

export type TokenKind = Token[0]
type TokenSorts = { [i in TokenKind]: [i, ...Rest<i, Token>] }

export type Tokenizer = {
  pos(): Pos
  take<K extends TokenKind>(k: K): TokenSorts[K] | undefined }

export function tokenizer(s: Scanner): Tokenizer {
  let t: Token

  function fatal(msg: string): never {
    throw new Error(`(${s.pos()}): tokenizer: ${msg}`) }

  function k(t: RegExp) {
    const matches = s.get().match(t);
    if (matches === null) {
      return null; }
    const [ws] = matches;
    s.skip(ws.length);
    return ws; }

  function pos(): Pos {
    return s.pos() }

  function take<K extends TokenKind>(k: K): TokenSorts[K] | undefined {
    if (t[0] === k) {
      const r = t as TokenSorts[K]
      skip()
      return r }
    return undefined }

  function skip(): void {
    if (s.get().length === 0) {
      t = ["eof"]
      return }
    k(/^(\s|\/\/([^\n\\]|\\.)*?(\n|$)|\/\*([^\*\\]|\\.|\*[^\/])*?(\*\/|$))*/)
    if (k(/^\(/)) { t = ["lparen"]; return }
    if (k(/^\)/)) { t = ["rparen"]; return }
    if (k(/^\\/)) { t = ["rsolidus"]; return }
    if (k(/^,/)) { t = ["comma"]; return }
    if (k(/^<</)) { t = ["lessless", "<<"]; return }
    if (k(/^>>/)) { t = ["moremore", ">>"]; return }
    if (k(/^==/)) { t = ["equalequal", "=="]; return }
    if (k(/^!=/)) { t = ["notequal", "!="]; return }
    if (k(/^!/)) { t = ["exclam", "!"]; return }
    if (k(/^~/)) { t = ["tilde", "~"]; return }
    if (k(/^=/)) { t = ["equal"]; return }
    if (k(/^>=/)) { t = ["moreequal", ">="]; return }
    if (k(/^>/)) { t = ["more", ">"]; return }
    if (k(/^<=/)) { t = ["lessequal", "<="]; return }
    if (k(/^</)) { t = ["less", "<"]; return }
    if (k(/^->/)) { t = ["arrow"]; return }
    if (k(/^\+/)) { t = ["plus", "+"]; return }
    if (k(/^\*\*/)) { t = ["astast", "**"]; return }
    if (k(/^\*/)) { t = ["ast", "*"]; return }
    if (k(/^\//)) { t = ["solidus", "/"]; return }
    if (k(/^%/)) { t = ["percent", "%"]; return }
    if (k(/^&&/)) { t = ["ampamp", "&&"]; return }
    if (k(/^&/)) { t = ["amp", "&"]; return }
    if (k(/^\^/)) { t = ["caret", "^"]; return }
    if (k(/^\|\|/)) { t = ["pipepipe", "||"]; return }
    if (k(/^\|/)) { t = ["pipe", "|"]; return }
    if (k(/^\?/)) { t = ["question", "?"]; return }
    if (k(/^:/)) { t = ["colon"]; return }
    if (k(/^\$/)) { t = ["dollar"]; return }
    if (k(/^where/)) { t = ["where"]; return }
    let r = k(/^("([^"\\]|\\.)*($|")|[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?|false|true)/)
    if (r) { t = ["literal", JSON.parse(r)]; return }
    if (k(/^\-/)) { t = ["hyphen", "-"]; return }
    r = k(/^[A-Za-z_][A-Za-z0-9_]*/)
    if (r) { t = ["identifier", r]; return }
    fatal(`Unrecognized character sequence.`)}

  skip()
  return { pos, take } }

const di: <X, Y, F extends (x: X) => Y>(x: X, f: F) => Y = (x, f) => f(x)

export const read: Read = tk => homproc((call, ret) => {
const
fatal: Fatal = m => { throw new Error(`(${tk.pos()}): ${m}`) },
parameters: PunctuatorProcess = k => () =>
  tk.take(k) ? jmp(expression) :
  di(tk.take("identifier"), i =>
  i ? call(parameters(k), dx => ret(make("abs", i[1], dx))) :
  fatal(`Expected token kind \`${k}\`.`)),
try_primary: () => Branch | null = () =>
  tk.take("rsolidus") ? jmp(parameters("arrow")) :
  tk.take("lparen") ? call(expression, x => tk.take("rparen") ? ret(x) : fatal(`Expected \`)\`.`)) :
  di(tk.take("literal"), c => c ? ret(make("lit", c[1])) :
  di(tk.take("identifier"), r => r ? ret(make("ref", r[1])) : null)),
primary: Process = () => di(try_primary(), up => up === null ? fatal("Expected a term.") : up),
juxt_rhs: TermBranch = x => di(try_primary(), up => up === null ? ret(x) : call(() => up, y => juxt_rhs(make("app", x, y)))),
juxt: Process = () => call(primary, juxt_rhs),
exponential_rhs: TermBranch = x =>
  tk.take("astast") ? call(juxt, y => exponential_rhs(make("app", make("app", make("ref", "**"), x), y))) :
  ret(x),
exponential: Process = () => call(juxt, exponential_rhs),
multiplicative_rhs: TermBranch = x =>
  tk.take("ast") ? call(exponential, y => multiplicative_rhs(make("app", make("app", make("ref", "*"), x), y))) :
  tk.take("solidus") ? call(exponential, y => multiplicative_rhs(make("app", make("app", make("ref", "/"), x), y))) :
  tk.take("percent") ? call(exponential, y => multiplicative_rhs(make("app", make("app", make("ref", "%"), x), y))) :
  ret(x),
multiplicative: Process = () => call(exponential, multiplicative_rhs),
additive_rhs: TermBranch = x =>
  tk.take("plus") ? call(multiplicative, y => additive_rhs(make("app", make("app", make("ref", "+"), x), y))) :
  tk.take("hyphen") ? call(multiplicative, y => additive_rhs(make("app", make("app", make("ref", "-"), x), y))) :
  ret(x),
additive: Process = () => call(multiplicative, additive_rhs),
shift_rhs: TermBranch = x =>
  tk.take("lessless") ? call(additive, y => shift_rhs(make("app", make("app", make("ref", "<<"), x), y))) :
  tk.take("moremore") ? call(additive, y => shift_rhs(make("app", make("app", make("ref", ">>"), x), y))) :
  ret(x),
shift: Process = () => call(additive, shift_rhs),
comparison_rhs: TermBranch = x =>
  tk.take("more") ? call(shift, y => comparison_rhs(make("app", make("app", make("ref", ">"), x), y))) :
  tk.take("moreequal") ? call(shift, y => comparison_rhs(make("app", make("app", make("ref", ">="), x), y))) :
  tk.take("less") ? call(shift, y => comparison_rhs(make("app", make("app", make("ref", "<"), x), y))) :
  tk.take("lessequal") ? call(shift, y => comparison_rhs(make("app", make("app", make("ref", "<="), x), y))) :
  ret(x),
comparison: Process = () => call(shift, comparison_rhs),
equality_rhs: TermBranch = x =>
  tk.take("equalequal") ? call(comparison, y => equality_rhs(make("app", make("app", make("ref", "=="), x), y))) :
  tk.take("notequal") ? call(comparison, y => equality_rhs(make("app", make("app", make("ref", "!="), x), y))) :
  ret(x),
equality: Process = () => call(comparison, equality_rhs),
binary_and_rhs: TermBranch = x =>
  tk.take("amp") ? call(equality, y => binary_and_rhs(make("app", make("app", make("ref", "&"), x), y))) :
  ret(x),
binary_and: Process = () => call(equality, binary_and_rhs),
binary_xor_rhs: TermBranch = x =>
  tk.take("caret") ? call(binary_and, y => binary_xor_rhs(make("app", make("app", make("ref", "^"), x), y))) :
  ret(x),
binary_xor: Process = () => call(binary_and, binary_xor_rhs),
binary_or_rhs: TermBranch = x =>
  tk.take("pipe") ? call(binary_xor, y => binary_or_rhs(make("app", make("app", make("ref", "|"), x), y))) :
  ret(x),
binary_or: Process = () => call(binary_xor, binary_or_rhs),
logical_and_rhs: TermBranch = x =>
  tk.take("ampamp") ? call(binary_or, y => logical_and_rhs(make("app", make("app", make("ref", "&&"), x), y))) :
  ret(x),
logical_and: Process = () => call(binary_or, logical_and_rhs),
logical_or_rhs: TermBranch = x =>
  tk.take("pipepipe") ? call(logical_and, y => logical_or_rhs(make("app", make("app", make("ref", "||"), x), y))) :
  ret(x),
logical_or: Process = () => call(logical_and, logical_or_rhs),
ternary: Process = () => call(logical_or, x => tk.take("question") ? call(dollar, y => tk.take("colon") ? call(ternary, z => ret(make("app", make("app", make("app", make("ref", "?"), x), y), z))) : fatal("Expected \`:\`.")) : ret(x)),
dollar: Process = () => call(ternary, x => tk.take("dollar") ? call(dollar, y => ret(make("app", x, y))) : ret(x)),
prefix: Process = () =>
  tk.take("exclam") ? call(primary, x => ret(make("app", make("ref", "!"), x))) :
  tk.take("tilde") ? call(primary, x => ret(make("app", make("ref", "~"), x))) :
  jmp(dollar),
defs: ModProcess = ([, m, x]) => () =>
  di(
    tk.take("identifier") ||
    tk.take("astast") ||
    tk.take("ast") ||
    tk.take("solidus") ||
    tk.take("percent") ||
    tk.take("plus") ||
    tk.take("hyphen") ||
    tk.take("lessless") ||
    tk.take("moremore") ||
    tk.take("less") ||
    tk.take("lessequal") ||
    tk.take("more") ||
    tk.take("moreequal") ||
    tk.take("equalequal") ||
    tk.take("notequal") ||
    tk.take("amp") ||
    tk.take("caret") ||
    tk.take("pipe") ||
    tk.take("ampamp") ||
    tk.take("pipepipe") ||
    tk.take("question"), i =>
  !i ? fatal(`Expected an identifier.`) :
  call(parameters("equal"), y => {
  m.push([i[1], y])
  return tk.take("rparen") ? ret(make("whr", m, x)) :
  tk.take("comma") ? jmp(defs(make("whr", m, x))) :
  fatal(`Expected \`)\` or \`,\`.`)})),
where_clause: TermProcess = x => () => ((r: Whr) => tk.take("rparen") ? ret(r) : jmp(defs(r)))(make("whr", [], x)),
where_seq: TermBranch = x => tk.take("where") ? !tk.take("lparen") ? fatal(`Expected \`(\`.`) : call(where_clause(x), where_seq) : ret(x),
where: Process = () => call(prefix, where_seq),
expression = where,
all: Process = () => call(expression, e => !tk.take("eof") ? fatal(`Expected end of file.`) : ret(e))
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
    sav: () => ret("*"),
    bar: () => ret("*"),
    blt: () => ret("*") })
return s(e) })

// export const to_jsmodule: Print = e => homproc((call, ret) => {
// const
//   module: ModuleProcess = m => () =>
//     m[0] === undefined ? ret("") :
//     (i => call(tree(i[1]), dd => call(module(m.slice(1)), dr => ret(`const _${i[0]} = m(() => ${dd}); ${dr}`))))(m[0]),
//   tree: GraphProcess = visit({
//     mod: ([, m, x]) => call(tree(x), dx => call(module(m), dm => ret(`(() => {${dm} return ${dx} })()`))),
//     app: ([, x, y]) => call(tree(x), dx => call(tree(y), dy => ret(`${dx}(m(() => ${dy}))`))),
//     add: ([, x, y]) => call(tree(x), dx => call(tree(y), dy => ret(`(${dx} + ${dy})`))),
//     sub: ([, x, y]) => call(tree(x), dx => call(tree(y), dy => ret(`(${dx} - ${dy})`))),
//     mul: ([, x, y]) => call(tree(x), dx => call(tree(y), dy => ret(`(${dx} * ${dy})`))),
//     div: ([, x, y]) => call(tree(x), dx => call(tree(y), dy => ret(`(${dx} / ${dy})`))),
//     eq: ([, x, y]) => call(tree(x), dx => call(tree(y), dy => ret(`(${dx} == ${dy})`))),
//     eq: ([, x, y]) => call(tree(x), dx => call(tree(y), dy => ret(`(${dx} != ${dy})`))),
//     if: ([, x, y, z]) => call(tree(x), dx => call(tree(y), dy => call(tree(z), dz => ret(`(${dx} ? ${dy} : ${dz})`)))),
//     abs: ([, i, x]) => call(tree(x), dx => ret(`_${i} => ${dx}`)),
//     ref: ([, r]) => ret(`_${r}()`),
//     lit: ([, c]) => ret(JSON.stringify(c)),
//     sav: () => ret("(*)"),
//     bar: () => ret("(*)") })
// return tree(e) })

type Builtins = { [i: string]: Normal }
export const get_builtin: Builtins = await (async () => {
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
  __builtin_and: make("blt", (call, ret, s, r) => call(s(r), dx => ret(make("abs", "x", dx[1] ? make("ref", "x") : dx)))),
  __builtin_or: make("blt", (call, ret, s, r) => call(s(r), dx => ret(make("abs", "x", dx[1] ? dx : make("ref", "x"))))),
  __builtin_elem: binary((a, b) => a[b]),
  __builtin_pi: nullary(Math.PI),
  __builtin_neg: unary(x => -x),
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
  __builtin_shead: unary(x => x[0]),
  __builtin_stail: unary(x => x.substring(1)),
  __builtin_jsonstringify: unary(JSON.stringify),
  __builtin_jsonparse: unary(JSON.parse),
  __builtin_document: nullary(document),
  __builtin_console: nullary(console),
  __builtin_WebSocket: nullary(WebSocket) } })()

export const bubble: (e: Sav) => Term = e => homproc((call, ret) => {
const s: SavProcess = e => () => call(visit({
  sav: y => call(s(y), () => jmp(s(e))),
  whr: y => ret(make("whr", y[1].map(d => [d[0], make("sav", e[1], d[1])]), make("sav", e[1], y[2]))),
  app: y => ret(make("app", make("sav", e[1], y[1]), make("sav", e[1], y[2]))),
  abs: y => {
    const o = { ...e[1] }
    if (y[1] in o) {
      delete o[y[1]] }
    return ret(make("abs", y[1], make("sav", o, y[2]))) },
  ref: y => {
    const u = e[1][y[1]]
    if (u === undefined) {
      return ret(y) }
    return ret(make("bar", u)) },
  bar: ret,
  lit: ret,
  blt: ret })(e[2]), de => ret(assign(e, de)))
return s(e) })

export const evaluate: (e: Term) => Normal = e => homproc((call, ret) => {
const s: GraphProcess = visit({
  sav: e => jmp(s(bubble(e))),
  whr: e => {
    const op: Definitions = { }
    for (const def of e[1]) {
      op[def[0]] = [make("sav", op, def[1])] }
    return jmp(s(make("sav", op, e[2]))) },
  app: e => call(s(e[1]), dx => {
    if (dx[0] === "abs") {
      return jmp(s(make("sav", { [dx[1]]: [e[2]] }, dx[2]))) }
    if (dx[0] === "blt") {
      return dx[1](call, ret, s, e[2]) }
    throw new Error(`Invalid application of \`${print(dx)}\` to \`${print(e[2])}\`.`) }),
  bar: e => call(s(e[1][0]), dx => (e[1][0] = dx, ret(dx))),
  ref: ([, i]) => (r => r ? ret(r) : (() => { throw new Error(`Undefined reference to \`${i}\`.`)})())(get_builtin[i]),
  abs: ret,
  blt: ret,
  lit: ret })
return s(e) })