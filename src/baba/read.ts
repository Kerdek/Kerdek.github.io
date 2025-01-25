import { NonEOFTokenKind, Tokenizer } from './tokenizer.js'
import { Expr, Stmt, StmtIf, StmtIfElse } from './tree.js'

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
primary: () => Expr | null = () => {
  if (tk.take("lparen")) {
    const e = comma()
    if (!tk.take("rparen")) fatal("Expected `)`.")
    return e }
  if (tk.take("lbracket")) {
    return { kind: "list", opers: list(equality, "comma", "rbracket") } }
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
  return { kind: "call", dest, opers: list(equality, "comma", "rparen") } },
bracket_access: (lhs: Expr) => Expr | null = lhs => {
  const rhs = equality()
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
multiplicative_rhs: (lhs: Expr) => Expr = lhs =>
  tk.take("ast") ? multiplicative_rhs({ kind: "mul", lhs, rhs: prefix() || fatal("Expected an expression.") }) :
  tk.take("solid") ? multiplicative_rhs({ kind: "div", lhs, rhs: prefix() || fatal("Expected an expression.") }) :
  tk.take("perc") ? multiplicative_rhs({ kind: "mod", lhs, rhs: prefix() || fatal("Expected an expression.") }) :
  lhs,
multiplicative = () => {
  const lhs = prefix()
  return lhs && multiplicative_rhs(lhs) },
additive_rhs: (lhs: Expr) => Expr = lhs =>
  tk.take("plus") ? additive_rhs({ kind: "add", lhs, rhs: multiplicative() || fatal("Expected an expression.") }) :
  tk.take("hyphen") ? additive_rhs({ kind: "sub", lhs, rhs: multiplicative() || fatal("Expected an expression.") }) :
  lhs,
additive = () => {
  const lhs = multiplicative()
  return lhs && additive_rhs(lhs) },
shift_rhs: (lhs: Expr) => Expr = lhs =>
  tk.take("ltlt") ? shift_rhs({ kind: "shl", lhs, rhs: additive() || fatal("Expected an expression.") }) :
  tk.take("gtgt") ? shift_rhs({ kind: "shr", lhs, rhs: additive() || fatal("Expected an expression.") }) :
  lhs,
shift = () => {
  const lhs = additive()
  return lhs && shift_rhs(lhs) },
comparison_rhs: (lhs: Expr) => Expr = lhs =>
  tk.take("gt") ? comparison_rhs({ kind: "gt", lhs, rhs: shift() || fatal("Expected an expression.") }) :
  tk.take("ge") ? comparison_rhs({ kind: "ge", lhs, rhs: shift() || fatal("Expected an expression.") }) :
  tk.take("lt") ? comparison_rhs({ kind: "lt", lhs, rhs: shift() || fatal("Expected an expression.") }) :
  tk.take("le") ? comparison_rhs({ kind: "le", lhs, rhs: shift() || fatal("Expected an expression.") }) :
  lhs,
comparison = () => {
  const lhs = shift()
  return lhs && comparison_rhs(lhs) },
equality_rhs: (lhs: Expr) => Expr = lhs =>
  tk.take("ee") ? equality_rhs({ kind: "ee", lhs, rhs: comparison() || fatal("Expected an expression.") }) :
  tk.take("ne") ? equality_rhs({ kind: "ne", lhs, rhs: comparison() || fatal("Expected an expression.") }) :
  lhs,
equality = () => {
  const lhs = comparison()
  return lhs && equality_rhs(lhs) },
bitand_rhs: (lhs: Expr) => Expr = lhs =>
  tk.take("amp") ? bitand_rhs({ kind: "bitand", lhs, rhs: equality() || fatal("Expected an expression.") }) :
  lhs,
bitand = () => {
  const lhs = equality()
  return lhs && bitand_rhs(lhs) },
bitxor_rhs: (lhs: Expr) => Expr = lhs =>
  tk.take("caret") ? bitxor_rhs({ kind: "bitxor", lhs, rhs: bitand() || fatal("Expected an expression.") }) :
  lhs,
bitxor = () => {
  const lhs = bitand()
  return lhs && bitxor_rhs(lhs) },
bitor_rhs: (lhs: Expr) => Expr = lhs =>
  tk.take("pipe") ? bitor_rhs({ kind: "bitor", lhs, rhs: bitxor() || fatal("Expected an expression.") }) :
  lhs,
bitor = () => {
  const lhs = bitxor()
  return lhs && bitor_rhs(lhs) },
logand_rhs: (lhs: Expr) => Expr = lhs =>
  tk.take("ampamp") ? logand_rhs({ kind: "logand", lhs, rhs: bitor() || fatal("Expected an expression.") }) :
  lhs,
logand = () => {
  const lhs = bitor()
  return lhs && logand_rhs(lhs) },
logor_rhs: (lhs: Expr) => Expr = lhs =>
  tk.take("pipepipe") ? logor_rhs({ kind: "logor", lhs, rhs: logand() || fatal("Expected an expression.") }) :
  lhs,
logor = () => {
  const lhs = logand()
  return lhs && logor_rhs(lhs) },
assignment = (): Expr | null => {
  const lhs = logor()
  return lhs && (
    tk.take("equal") ? { kind: "assign", lhs, rhs: assignment() || fatal("Expected an expression.") } :
    tk.take("pluseq") ? { kind: "assignadd", lhs, rhs: assignment() || fatal("Expected an expression.") } :
    tk.take("hypheneq") ? { kind: "assignsub", lhs, rhs: assignment() || fatal("Expected an expression.") } :
    tk.take("asteq") ? { kind: "assignmul", lhs, rhs: assignment() || fatal("Expected an expression.") } :
    tk.take("solideq") ? { kind: "assigndiv", lhs, rhs: assignment() || fatal("Expected an expression.") } :
    tk.take("perceq") ? { kind: "assignmod", lhs, rhs: assignment() || fatal("Expected an expression.") } :
    tk.take("ltlteq") ? { kind: "assignshl", lhs, rhs: assignment() || fatal("Expected an expression.") } :
    tk.take("gtgteq") ? { kind: "assignshr", lhs, rhs: assignment() || fatal("Expected an expression.") } :
    tk.take("ampeq") ? { kind: "assignbitand", lhs, rhs: assignment() || fatal("Expected an expression.") } :
    tk.take("careteq") ? { kind: "assignbitxor", lhs, rhs: assignment() || fatal("Expected an expression.") } :
    tk.take("pipeeq") ? { kind: "assignbitor", lhs, rhs: assignment() || fatal("Expected an expression.") } :
    tk.take("ampampeq") ? { kind: "assignlogand", lhs, rhs: assignment() || fatal("Expected an expression.") } :
    tk.take("pipepipeeq") ? { kind: "assignlogor", lhs, rhs: assignment() || fatal("Expected an expression.") } :
    lhs) },
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
      const cond = equality() || fatal("Expected an expression.")
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
    const cond = equality() || fatal("Expected an expression.")
    if (!tk.take("lbrace")) fatal("Expected `{`.")
    const body = statements()
    if (!tk.take("rbrace")) fatal("Expected `}`.")
    return { kind: "while", cond, body } }
  else if (tk.take("for")) {
    const c = tk.take("identifier")
    if (c) {
      if (!tk.take("in")) {
        fatal("Expected `in`.") }
        const range = equality() || fatal("Expected an expression.")
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
    const cond = equality() || fatal("Expected an expression.")
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
