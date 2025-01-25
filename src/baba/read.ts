import { NonEOFTokenKind, Tokenizer } from './tokenizer.js'
import { BinaryExprKind, Expr, Stmt, StmtIf, StmtIfElse } from './tree.js'

export const read: (tk: Tokenizer) => Stmt[] = tk => {
const
fatal: (m: string) => never = m => { throw `(${tk.pos()[0]}:${tk.pos()[1]}:${tk.pos()[2]}): ${m}` },
list: <E>(e: () => E | null, cont: NonEOFTokenKind, end: NonEOFTokenKind) => E[] = (e, cont, end) => {
  const opers: NonNullable<ReturnType<typeof e>>[] = []
  if (tk.take(end)) {
    return opers }
  for (;;) {
    const elem = e()
    if (!elem) fatal("Expected an expression")
    opers.push(elem)
    if (tk.take(end)) return opers
    if (!tk.take(cont)) fatal("Expected `,` or `)`") } },
infixl: (table: [NonEOFTokenKind, BinaryExprKind][], next: () => Expr | null) => () => Expr | null = (table, next) => () => {
  const rhs: (lhs: Expr) => Expr = lhs => {
    for (const entry of table) {
      if (tk.take(entry[0])) { return rhs(<Expr>{ kind: entry[1], lhs, rhs: next() || fatal("Expected an expression.") }) } }
    return lhs }
  const lhs = next()
  return lhs && rhs(lhs) },
primary: () => Expr | null = () => {
  if (tk.take("lparen")) {
    const e = comma()
    if (!tk.take("rparen")) fatal("Expected `)`.")
    return e }
  if (tk.take("lbracket")) {
    return { kind: "list", opers: list(logor, "comma", "rbracket") } }
  const cl = tk.take("literal")
  if (cl) {
    return { kind: "lit", value:
      cl[1] === "null" ? null :
      JSON.parse(cl[1][0] === "'" ? `"${cl[1].slice(1, -1)}"` : cl[1]) } }
  const ci = tk.take("identifier")
  if (ci) {
      return { kind: "ref", id: ci[1] } }
  return null },
call: (dest: Expr) => Expr | null = dest => {
  return { kind: "call", dest, opers: list(logor, "comma", "rparen") } },
bracket_access: (lhs: Expr) => Expr | null = lhs => {
  const rhs = logor()
  if (!rhs) { return null }
  if (!tk.take("rbracket")) fatal("Expected `]`.")
  return { kind: "access", lhs, rhs } },
dot_access: (lhs: Expr) => Expr = lhs => {
  const c = tk.take("identifier")
  if (!c) fatal("Expected an identifier.")
  return { kind: "access", lhs, rhs: { kind: "lit", value: c[1] } } },
postfix_rhs: (lhs: Expr) => Expr = lhs =>
  tk.take("lparen") ? postfix_rhs(call(lhs) || fatal("Expected an expression.")) :
  tk.take("lbracket") ? postfix_rhs(bracket_access(lhs) || fatal("Expected an expression.")) :
  tk.take("dot") ? postfix_rhs(dot_access(lhs)) :
  lhs,
postfix = () => {
  const lhs = primary()
  return lhs && postfix_rhs(lhs) },
prefix = (): Expr | null =>
  tk.take("plus") ? { kind: "pos", oper: prefix() || fatal("Expected an expression.") } :
  tk.take("hyphen") ? { kind: "neg", oper: prefix() || fatal("Expected an expression.") } :
  tk.take("exclam") ? { kind: "not", oper: prefix() || fatal("Expected an expression.") } :
  tk.take("tilde") ? { kind: "bitcmp", oper: prefix() || fatal("Expected an expression.") } :
  postfix(),
logor = infixl([
  ["pipepipe", "logor"]], infixl([
  ["ampamp", "logand"]], infixl([
  ["pipe", "bitor"]], infixl([
  ["caret", "bitxor"]], infixl([
  ["amp", "bitand"]], infixl([
  ["ee", "ee"],
  ["ne", "ne"]], infixl([
  ["gt", "gt"],
  ["ge", "ge"],
  ["lt", "lt"],
  ["le", "le"]], infixl([
  ["ltlt", "shl"],
  ["gtgt", "shr"]], infixl([
  ["plus", "add"],
  ["hyphen", "sub"]], infixl([
  ["ast", "mul"],
  ["solid", "div"],
  ["perc", "mod"]], prefix)))))))))),
assignment = (): Expr | null => {
  const lhs = logor()
  if (!lhs) return null
  const table: [NonEOFTokenKind, BinaryExprKind][] = [
    ["equal", "assign"],
    ["pluseq", "assignadd"],
    ["hypheneq", "assignsub"],
    ["asteq", "assignmul"],
    ["solideq", "assigndiv"],
    ["perceq", "assignmod"],
    ["ltlteq", "assignshl"],
    ["gtgteq", "assignshr"],
    ["ampeq", "assignbitand"],
    ["careteq", "assignbitxor"],
    ["pipeeq", "assignbitor"],
    ["ampampeq", "assignlogand"],
    ["pipepipeeq", "assignlogor"]]
  for (const entry of table) {
    if (tk.take(entry[0])) { return <Expr>{ kind: entry[1], lhs, rhs: assignment() || fatal("Expected an expression.") } } }
  return lhs },
comma = (): Expr | null => {
  const lhs = assignment()
  return lhs && (tk.take("comma") ? { kind: "comma", lhs, rhs: comma() || fatal("Expected an expression.") } : lhs) },
identifier = () => {
  const c = tk.take("identifier")
  if (!c) fatal("Expected an identifier.")
  return c[1] },
statement = (): Stmt | null => {
  if (tk.take("fun")) {
    const c = tk.take("identifier")
    if (!c) fatal("Expected an identifier.")
    if (!tk.take("lparen")) fatal("Expected `(`.")
    const params = list(identifier, "comma", "rparen")
    if (!tk.take("lbrace")) fatal("Expected `{`.")
    const body = statements()
    if (!tk.take("rbrace")) fatal("Expected `}`.")
    return { kind: "function", name: { kind: "ref", id: c[1] }, params, body }}
  else if (tk.take("if")) {
    function go(): StmtIf | StmtIfElse {
      const cond = logor() || fatal("Expected an expression.")
      if (!tk.take("lbrace")) fatal("Expected `{`.")
      const then = statements() || fatal("Expected an expression.")
      if (!tk.take("rbrace")) fatal("Expected `}`.")
      if (!tk.take("else")) return { kind: "if", cond, then }
      if (tk.take("if")) return { kind: "ifelse", cond, then, else: go() }
      if (!tk.take("lbrace")) fatal("Expected `{`.")
      const els = statements()
      if (!tk.take("rbrace")) fatal("Expected `}`.")
      return { kind: "ifelse", cond, then, else: els } }
    return go() }
  else if (tk.take("while")) {
    const cond = logor() || fatal("Expected an expression.")
    if (!tk.take("lbrace")) fatal("Expected `{`.")
    const body = statements()
    if (!tk.take("rbrace")) fatal("Expected `}`.")
    return { kind: "while", cond, body } }
  else if (tk.take("for")) {
    const c = tk.take("identifier")
    if (c) {
      if (!tk.take("in")) {
        fatal("Expected `in`.") }
        const range = logor() || fatal("Expected an expression.")
        if (!tk.take("lbrace")) {
          fatal("Expected `{`.") }
        const body = statements()
        if (!tk.take("rbrace")) {
          fatal("Expected `}`.") }
        return { kind: "forin", lhs: { kind: "ref", id: c[1] }, range, body } }
    if (!tk.take("lparen")) fatal("Expected `(`.")
    const cond0 = comma() || fatal("Expected an expression.")
    if (!tk.take("semicolon")) fatal("Expected `;`.")
    const cond1 = comma() || fatal("Expected an expression.")
    if (!tk.take("semicolon")) fatal("Expected `;`.")
    const cond2 = comma() || fatal("Expected an expression.")
    if (!tk.take("rparen")) fatal("Expected `)`.")
    if (!tk.take("lbrace")) fatal("Expected `{`.")
    const body = statements()
    if (!tk.take("rbrace")) fatal("Expected `}`.")
    return { kind: "for", conds: [cond0, cond1, cond2], body } }
  else if (tk.take("do")) {
    if (!tk.take("lbrace")) fatal("Expected `{`.")
    const body = statements()
    if (!tk.take("rbrace")) fatal("Expected `}`.")
    if (!tk.take("while")) fatal("Expected `while`.")
    const cond = logor() || fatal("Expected an expression.")
    return { kind: "dowhile", body, cond } }
  else if (tk.take("return")) {
    const oper = comma() || fatal("Expected an expression.")
    if (!tk.take("semicolon")) fatal("Expected `;`.")
    return { kind: "return", oper } }
  else if (tk.take("break")) {
    if (!tk.take("semicolon")) fatal("Expected `;`.")
    return { kind: "break" }}
  else if (tk.take("continue")) {
    if (!tk.take("semicolon")) fatal("Expected `;`.")
    return { kind: "continue" } }
  else if (tk.take("semicolon")) {
    return { kind: "empty" } }
  else {
    const expr = comma()
    if (!expr) return null
    if (!tk.take("semicolon")) fatal("Expected `;`.")
    return { kind: "expr", expr } } },
statements = () => {
  const r: Stmt[] = []
  for (;;) {
    const s = statement()
    if (!s) {
      return r; }
    r.push(s) } }

const e = statements()
if (!tk.take("eof")) fatal("Expected end of file.")
return e }
