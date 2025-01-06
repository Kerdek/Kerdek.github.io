
export const read: Read = x => (procv((call, ret) => {
type Take = (re: RegExp) => Token
type Token = () => string | null
type TextPosition = [string, number, number]
type Fatal = (msg: string) => never
const
  k: Take = t => () => {
    const r = x.match(t)
    if (!r) {
      return null }
    for (let re = /\n/g, colo = 0;;) {
      const m = re.exec(r[0])
      if (!m) {
        w[2] += r[0].length - colo
        x = x.slice(r[0].length)
        return r[0] }
      colo = m.index + w[2]
      w[1]++ } },
  ws = k(/^(\s|\/\/([^\n\\]|\\[\s\S])*?(\n|$)|\/\*([^\*\\]|\\[\s\S])*?(\*\/|$))*/),
  id = k(/^\w[\w0-9]*/),
  sc = k(/^"([^"\\]|\\.)*("|$)/),
  nc = k(/^[+-]?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?/),
  tc = k(/^true/), fc = k(/^false/),
  lm = k(/^(\\|λ)/), dt = k(/^\./), ds = k(/^\$/), as = k(/^\*/), at = k(/^@/),
  lp = k(/^\(/), rp = k(/^\)/), lb = k(/^\[/), rb = k(/^\]/), cm = k(/^,/), cn = k(/^:/),
  pl = k(/^\+/), mn = k(/^-/), so = k(/^\//), pc = k(/^%/), rr = k(/^>>/), ll = k(/^<</), ex = k(/^\*\*/),
  gt = k(/^>/), ge = k(/^>=/), lt = k(/^</), le = k(/^<=/), ne = k(/^!=/), ee = k(/^==/),
  am = k(/^&/), ba = k(/^\|/), cr = k(/^\^/), hs = k(/^#/),
  fatal: Fatal = m => { throw new Error(`(${w}): ${m}`) },
  parameter_list: Process = () => (ws(), dt() ? jmp(expression) : ((o, i) => i ? call(parameter_list, x => ret(make<Tree>("abs", i, o ? "applicative" : "lazy", x))) : fatal("Expected `.` or an identifier."))(as(), (ws(), id()))),
  cons_list: Process = () => (ws(), call(expression, x => cm() ? call(cons_list, y => ret(make("cns", x, y))) : rb() ? ret(make("cns", x, make("bol", false))) : fatal(`Expected \`,\` or \`]\`.`))),
  primary: () => Process | null = () => (ws(),
    hs() ? () => (r => r ? (() => {
      const text = progs[JSON.parse(r)]
      if (text === undefined) {
        fatal(`\`${r}\` is not a known include`) }
      x = `${text})${x}`
      const wp: TextPosition = [...w]
      w[0] = r, w[1] = 1, w[2] = 1
      return call(expression, m => (rp(), w[0] = wp[0], w[1] = wp[1], w[2] = wp[2], ret(make("bar", "{module}", m)))) })() : fatal("Expected a string."))(sc()) :
    lm() ? () => jmp(parameter_list) :
    at() ? () => ret(make("rec")) :
    lb() ? () => rb() ? ret(make("bol", false)) : jmp(cons_list) :
    lp() ? () => (wp => call(expression, x => rp() ? ret(x) : fatal(`Expected \`)\` to match \`(\` at (${wp}).`)))([...w]) :
    (r => r ? () => ret(make("str", JSON.parse(r))) :
    (r => r ? () => ret(make("num", JSON.parse(r))) :
    (r => r ? () => ret(make("bol", JSON.parse(r))) :
    (r => r ? () => ret(make("ref", r)) : null)(id()))(fc() || tc()))(nc()))(sc())),
  application_lhs: TreeBranch = x => (up => up ? call(up, y => application_lhs(make("app", x, y))) : ret(x))(primary()),
  application: Process = () => (up => up ? call(up, x => application_lhs(x)) : fatal("Expected a term."))(primary()),
  right_associative: (next: Process, tk: Token, top: Process, kind: Binary[0]) => Branch = (next, tk, top, kind) => call(next, x => tk() ? call(top, y => ret(make<Binary>(kind, x, y))) : ret(x)),
  dot_composition_lhs: TreeBranch = x => dt() ? call(application, y => dot_composition_lhs(make("cmp", x, y))) : ret(x),
  dot_composition: Process = () => call(application, dot_composition_lhs),
  exponential_lhs: TreeBranch = x => ex() ? call(dot_composition, y => exponential_lhs(make("exp", x, y))) : ret(x),
  exponential: Process = () => call(dot_composition, exponential_lhs),
  multiplicative_rhs: TreeBranch = x =>
    as() ? call(exponential, y => multiplicative_rhs(make("mul", x, y))) :
    so() ? call(exponential, y => multiplicative_rhs(make("div", x, y))) :
    pc() ? call(exponential, y => multiplicative_rhs(make("mod", x, y))) :
    ret(x),
  multiplicative: Process = () => call(exponential, multiplicative_rhs),
  additive_rhs: TreeBranch = x =>
    pl() ? call(multiplicative, y => additive_rhs(make("add", x, y))) :
    mn() ? call(multiplicative, y => additive_rhs(make("sub", x, y))) :
    ret(x),
  additive: Process = () => call(multiplicative, additive_rhs),
  shift_rhs: TreeBranch = x =>
    ll() ? call(additive, y => shift_rhs(make("shl", x, y))) :
    rr() ? call(additive, y => shift_rhs(make("shr", x, y))) :
    ret(x),
  shift: Process = () => call(additive, shift_rhs),
  equal: Process = () => right_associative(shift, ee, less, "eeq"),
  not_equal: Process = () => right_associative(equal, ne, less, "neq"),
  greater_equal: Process = () => right_associative(not_equal, ge, less, "geq"),
  greater: Process = () => right_associative(greater_equal, gt, less, "gtn"),
  less_equal: Process = () => right_associative(greater, le, less, "leq"),
  less: Process = () => right_associative(less_equal, lt, less, "ltn"),
  bitwise_and_lhs: TreeBranch = x => am() ? call(less, y => bitwise_and_lhs(make("bcj", x, y))) : ret(x),
  bitwise_and: Process = () => call(less, bitwise_and_lhs),
  bitwise_xor_lhs: TreeBranch = x => cr() ? call(bitwise_and, y => bitwise_xor_lhs(make("bxj", x, y))) : ret(x),
  bitwise_xor: Process = () => call(bitwise_and, bitwise_xor_lhs),
  bitwise_or_lhs: TreeBranch = x => ba() ? call(bitwise_xor, y => bitwise_or_lhs(make("bdj", x, y))) : ret(x),
  bitwise_or: Process = () => call(bitwise_xor, bitwise_or_lhs),
  colon_cons: Process = () => right_associative(bitwise_or, cn, colon_cons, "cns"),
  dollar_application: Process = () => right_associative(colon_cons, ds, dollar_application, "app"),
  expression = dollar_application
let w: TextPosition = ["<user input>", 1, 1]
return () => call(expression, e => x.length !== 0 ? fatal(`Expected end of file.`) : ret(e)) }))
