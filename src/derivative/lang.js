// import { Branch, homproc, jmp, Process, async_homproc, AsyncProcess, AsyncBranch } from '../run.js'
export {};
// // syntax node types
// type Neg = ["neg", Tree]
// type Sqrt = ["sqrt", Tree]
// type Exp = ["exp", Tree]
// type Log = ["log", Tree]
// type Sin = ["sin", Tree]
// type Cos = ["cos", Tree]
// type Tan = ["tan", Tree]
// type ASin = ["asin", Tree]
// type ACos = ["acos", Tree]
// type ATan = ["atan", Tree]
// type ATan2 = ["atan2", Tree, Tree]
// type SinH = ["sinh", Tree]
// type CosH = ["cosh", Tree]
// type TanH = ["tanh", Tree]
// type ASinH = ["asinh", Tree]
// type ACosH = ["acosh", Tree]
// type ATanH = ["atanh", Tree]
// type Add = ["add", Tree, Tree]
// type Sub = ["sub", Tree, Tree]
// type Mul = ["mul", Tree, Tree]
// type Div = ["div", Tree, Tree]
// type Pow = ["pow", Tree, Tree]
// type Lt = ["lt", Tree, Tree]
// type Gt = ["gt", Tree, Tree]
// type Le = ["le", Tree, Tree]
// type Ge = ["ge", Tree, Tree]
// type If = ["if", Tree, Tree, Tree]
// type Ref = ["ref", string]
// type Lit = ["lit", number]
// export type Tree =
//   Neg | Sqrt | Exp | Log |
//   Sin | Cos | Tan | ASin | ACos | ATan | ATan2 |
//   SinH | CosH | TanH | ASinH | ACosH | ATanH |
//   Add | Sub | Mul | Div | Pow |
//   Lt | Gt | Le | Ge |
//   If |
//   Ref | Lit | Ref
// export type Kind = Tree[0]
// export type UnaryKind =
//   "sqrt" | "exp" | "log" |
//   "sin" | "cos" | "tan" | "asin" | "acos" | "atan" |
//   "sinh" | "cosh" | "tanh" | "asinh" | "acosh" | "atanh"
// export type BinaryKind = "atan2"
// export type InfixKind =
//   "add" | "sub" | "mul" | "div" | "pow" |
//   "lt" | "gt" | "le" | "ge"
// export type AsyncRead = (src: string) => Promise<Tree>
// export type Pretty = (e: Tree) => string
// export type Implement = (o: Definitions, e: Tree) => number
// type Sorts = { [i in Kind]: [i, ...Rest<i, Tree>] }
// type Rest<i, T> = T extends [i, ...infer R] ? R : never
// type Make = <K extends Tree>(...x: K) => K
// type Assign = <K extends Tree>(e: Tree, x: K) => K
// type Tbl = <K extends Kind, R>(o: { [i in K]: (e: Sorts[i]) => R }) => <I extends K>(e: Sorts[I]) => R
// type Visit = <K extends Kind>(o: { [i in K]: (e: Sorts[i]) => Branch }) => <I extends K>(e: Sorts[I]) => Process
// type Format = (x: string) => string
// type Parens = (q: boolean) => Format
// type AsyncTreeBranch = (e: Tree) => Promise<AsyncBranch>
// type TreeProcess = (e: Tree) => Process
// type PrintProcess = (precedence: number) => TreeProcess
// export const assign: Assign = (e, x) => {
//   let i = 0
//   for (; i < x.length; i++) {
//     e[i] = x[i] as any }
//   for (; i < e.length; i++) {
//     delete e[i] }
//   return e as any }
// export const make: Make = (...x) => x
// export const tbl: Tbl = o => e => o[e[0]](e)
// export const visit: Visit = o => e => (f => () => f(e))(o[e[0]])
// export const read: AsyncRead = async x => (async_homproc((call, ret) => {
// type Take = (re: RegExp) => Token
// type Token = () => string | null
// type TextPosition = [number, number]
// type Fatal = (msg: string) => never
// let w: TextPosition = [1, 1]
// const
//   k: Take = t => () => {
//     const r = x.match(t)
//     if (!r) {
//       return null }
//     for (let re = /\n/g, colo = 0;;) {
//       const m = re.exec(r[0])
//       if (!m) {
//         w[1] += r[0].length - colo
//         x = x.slice(r[0].length)
//         return r[0] }
//       colo = m.index + w[1]
//       w[0]++ } },
//   ws = k(/^(\s|\/\/([^\n\\]|\\[\s\S])*?(\n|$)|\/\*([^\*\\]|\\[\s\S])*?(\*\/|$))*/),
//   id = k(/^\w[\w0-9]*/),
//   nc = k(/^[+-]?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?/),
//   lp = k(/^\(/), rp = k(/^\)/), qm = k(/^\?/), cn = k(/^:/), cm = k(/^,/), pl = k(/^\+/), mn = k(/^\-/), ss = k(/^\*\*/), as = k(/^\*/), so = k(/^\//),
//   le = k(/^<=/), ge = k(/^>=/), lt = k(/^</), gt = k(/^>/),
//   fatal: Fatal = m => { throw new Error(`(${w}): ${m}`) },
//   unary_funcall: (i: UnaryKind) => AsyncBranch = i => (ws(), lp()) ? (wp => call(expression, async x => (ws(), rp()) ? ret(make(i, x)) : fatal(`Expected \`)\` to match \`(\` at (${wp}).`)))([...w]) : fatal("Expected \`(\`."),
//   binary_funcall: (i: BinaryKind) => AsyncBranch = i => (ws(), lp()) ? (wp => call(expression, async x => (ws(), cm()) ? call(expression, async y => (ws(), rp()) ? ret(make(i, x, y)) : fatal(`Expected \`)\` to match \`(\` at (${wp}).`)) : fatal(`Expected \`,\`.`)))([...w]) : fatal("Expected \`(\`."),
//   primary: AsyncProcess = async () => (ws(),
//    lp() ? (wp => call(expression, async x => (ws(), rp()) ? ret(x) : fatal(`Expected \`)\` to match \`(\` at (${wp}).`)))([...w]) :
//     (r => r ? ret(make("lit", JSON.parse(r))) :
//     (r => r ?
//       r === "sqrt" ||
//       r === "exp" ||
//       r === "log" ||
//       r === "sin" ||
//       r === "cos" ||
//       r === "tan" ||
//       r === "asin" ||
//       r === "acos" ||
//       r === "atan" ||
//       r === "sinh" ||
//       r === "cosh" ||
//       r === "tanh" ||
//       r === "asinh" ||
//       r === "acosh" ||
//       r === "atanh" ? unary_funcall(r) :
//       r === "atan2" ? binary_funcall(r) :
//       r === "pi" ? ret(make("lit", Math.PI)) :
//       ret(make("ref", r)) :
//     fatal("Expected an expression."))(id()))(nc())),
//   prefix: AsyncProcess = async() => (ws(), mn()) ? call(prefix, async x => ret(make("neg", x))): jmp(primary),
//   exponential_rhs: AsyncTreeBranch = async x => (ws(),
//     ss() ? call(prefix, async y => exponential_rhs(make("pow", x, y))) :
//     ret(x)),
//   exponential: AsyncProcess = async () => call(prefix, exponential_rhs),
//   multiplicative_rhs: AsyncTreeBranch = async x => (ws(),
//     as() ? call(exponential, async y => multiplicative_rhs(make("mul", x, y))) :
//     so() ? call(exponential, async y => multiplicative_rhs(make("div", x, y))) :
//     ret(x)),
//   multiplicative: AsyncProcess = async () => call(exponential, multiplicative_rhs),
//   additive_rhs: AsyncTreeBranch = async x => (ws(),
//     pl() ? call(multiplicative, async y => additive_rhs(make("add", x, y))) :
//     mn() ? call(multiplicative, async y => additive_rhs(make("sub", x, y))) :
//     ret(x)),
//   additive: AsyncProcess = async () => call(multiplicative, additive_rhs),
//   comparison_rhs: AsyncTreeBranch = async x => (ws(),
//     le() ? call(additive, async y => comparison_rhs(make("le", x, y))) :
//     ge() ? call(additive, async y => comparison_rhs(make("ge", x, y))) :
//     lt() ? call(additive, async y => comparison_rhs(make("lt", x, y))) :
//     gt() ? call(additive, async y => comparison_rhs(make("gt", x, y))) :
//     ret(x)),
//   comparison: AsyncProcess = async () => call(additive, comparison_rhs),
//   ternary: AsyncProcess = async() => call(comparison, async dx => qm() ? call(expression, async dy => cn() ? call(ternary, async dz => ret(make("if", dx, dy, dz))) : fatal(`Expected \`:\`.`)) : ret(dx)),
//   expression = ternary
// return async () => call(expression, async e => x.length !== 0 ? fatal(`Expected end of file.`) : ret(e)) }))
// export const pretty: Pretty = e => homproc((call, ret) => {
// const
//   p: Parens = q => q ? t => `(${t})` : t => t,
//   s: PrintProcess = pr => {
//     const
//       unary: (name: string) => (e: Sorts[UnaryKind]) => Branch =
//         name => ([, x]) => call(s(0)(x), dx => ret(`${name}(${dx})`)),
//       binary: (name: string) => (e: Sorts[BinaryKind]) => Branch =
//         name => ([, x, y]) => call(s(0)(x), dx => call(s(0)(y), dy => ret(`${name}(${dx}, ${dy})`))),
//       infix: (name: string, precedence: number) => (e: Sorts[InfixKind]) => Branch =
//         (name, pre) => ([, x, y]) => call(s(pre)(x), dx => call(s(pre + 1)(y), dy => ret(p(pr > pre)(`${dx} ${name} ${dy}`))))
//     return visit({
//       sqrt: unary("sqrt"),
//       exp: unary("exp"),
//       log: unary("log"),
//       sin: unary("sin"),
//       cos: unary("cos"),
//       tan: unary("tan"),
//       asin: unary("asin"),
//       acos: unary("acos"),
//       atan: unary("atan"),
//       atan2: binary("atan2"),
//       sinh: unary("sinh"),
//       cosh: unary("cosh"),
//       tanh: unary("tanh"),
//       asinh: unary("asinh"),
//       acosh: unary("acosh"),
//       atanh: unary("atanh"),
//       neg: ([, x]) => call(s(5)(x), dx => ret(`-${dx}`)),
//       pow: infix("**", 4),
//       mul: infix("*", 3),
//       div: infix("/", 3),
//       add: infix("+", 2),
//       sub: infix("-", 2),
//       lt: infix("<", 1),
//       gt: infix(">", 1),
//       le: infix("<=", 1),
//       ge: infix(">=", 1),
//       if: ([, x, y, z]) => call(s(1)(x), dx => call(s(0)(y), dy => call(s(0)(z), dz => ret(p(pr > 0)(`${dx} ? ${dy} : ${dz}`))))),
//       ref: ([, i]) => ret(`${i}`),
//       lit: ([, v]) => ret(JSON.stringify(v)) }) }
// return s(0)(e) })
// const powfix: (a: number, b: number) => number = (a, b) => a === 0 && b === 0 ? NaN : a ** b
// type Definitions = { [i: string]: number }
// export const implement: Implement = (o, e) => homproc((call, ret) => {
// const s: (o: Definitions) => TreeProcess = o => visit({
//   neg: ([, x]) => call(s(o)(x), dx => ret(-dx)),
//   sqrt: ([, x]) => call(s(o)(x), dx => ret(Math.sqrt(dx))),
//   exp: ([, x]) => call(s(o)(x), dx => ret(Math.exp(dx))),
//   log: ([, x]) => call(s(o)(x), dx => ret(Math.log(dx))),
//   sin: ([, x]) => call(s(o)(x), dx => ret(Math.sin(dx))),
//   cos: ([, x]) => call(s(o)(x), dx => ret(Math.cos(dx))),
//   tan: ([, x]) => call(s(o)(x), dx => ret(Math.tan(dx))),
//   asin: ([, x]) => call(s(o)(x), dx => ret(Math.asin(dx))),
//   acos: ([, x]) => call(s(o)(x), dx => ret(Math.acos(dx))),
//   atan: ([, x]) => call(s(o)(x), dx => ret(Math.atan(dx))),
//   atan2: ([, x, y]) => call(s(o)(x), dx => call(s(o)(y), dy => ret(Math.atan2(dx, dy)))),
//   sinh: ([, x]) => call(s(o)(x), dx => ret(Math.sinh(dx))),
//   cosh: ([, x]) => call(s(o)(x), dx => ret(Math.cosh(dx))),
//   tanh: ([, x]) => call(s(o)(x), dx => ret(Math.tanh(dx))),
//   asinh: ([, x]) => call(s(o)(x), dx => ret(Math.asinh(dx))),
//   acosh: ([, x]) => call(s(o)(x), dx => ret(Math.acosh(dx))),
//   atanh: ([, x]) => call(s(o)(x), dx => ret(Math.atanh(dx))),
//   add: ([, x, y]) => call(s(o)(x), dx => call(s(o)(y), dy => ret(dx + dy))),
//   sub: ([, x, y]) => call(s(o)(x), dx => call(s(o)(y), dy => ret(dx - dy))),
//   mul: ([, x, y]) => call(s(o)(x), dx => call(s(o)(y), dy => ret(dx * dy))),
//   div: ([, x, y]) => call(s(o)(x), dx => call(s(o)(y), dy => ret(dx / dy))),
//   pow: ([, x, y]) => call(s(o)(x), dx => call(s(o)(y), dy => ret(powfix(dx, dy)))),
//   lt: ([, x, y]) => call(s(o)(x), dx => call(s(o)(y), dy => ret(dx < dy ? 1 : 0))),
//   gt: ([, x, y]) => call(s(o)(x), dx => call(s(o)(y), dy => ret(dx > dy ? 1 : 0))),
//   le: ([, x, y]) => call(s(o)(x), dx => call(s(o)(y), dy => ret(dx <= dy ? 1 : 0))),
//   ge: ([, x, y]) => call(s(o)(x), dx => call(s(o)(y), dy => ret(dx >= dy ? 1 : 0))),
//   if: ([, x, y, z]) => call(s(o)(x), dx => jmp(s(o)(dx ? y : z))),
//   ref: ([, x]) => (r => r !== undefined ? ret(r) : (() => { throw new Error(`Undefined reference to \`${x}\`.`)})())(o[x]),
//   lit: ([, v]) => ret(v) })
// return s(o)(e) })
// export const partial_differential: (i: string, e: Tree) => Tree = (i, e) => homproc((call, ret) => {
//   const s: TreeProcess = visit({
//     neg: ([, x]) => call(s(x), dx => ret(make("neg", dx))),
//     sqrt: ([, x]) => call(s(x), dx => ret(make("div", dx, make("mul", make("lit", 2), make("sqrt", x))))),
//     exp: ([, x]) => call(s(x), dx => ret(make("mul", make("exp", x), dx))),
//     log: ([, x]) => call(s(x), dx => ret(make("div", dx, x))),
//     sin: ([, x]) => call(s(x), dx => ret(make("mul", make("cos", x), dx))),
//     cos: ([, x]) => call(s(x), dx => ret(make("neg", make("mul", make("sin", x), dx)))),
//     tan: ([, x]) => jmp(s(make("div", make("sin", x), make("cos", x)))),
//     asin: ([, x]) => call(s(x), dx => ret(make("div", dx, make("sqrt", make("sub", make("lit", 1), make("pow", x, make("lit", 2))))))),
//     acos: ([, x]) => call(s(x), dx => ret(make("neg", make("div", dx, make("sqrt", make("sub", make("lit", 1), make("pow", x, make("lit", 2)))))))),
//     atan: ([, x]) => call(s(x), dx => ret(make("div", dx, make("add", make("pow", x, make("lit", 2)), make("lit", 1))))),
//     atan2: ([, x, y]) => call(s(x), dx => call(s(y), dy => ret(make("div", make("sub", make("mul", dx, y), make("mul", x, dy)), make("add", make("pow", x, make("lit", 2)), make("pow", y, make("lit", 2))))))),
//     sinh: ([, x]) => call(s(x), dx => ret(make("mul", make("cosh", x), dx))),
//     cosh: ([, x]) => call(s(x), dx => ret(make("mul", make("sinh", x), dx))),
//     tanh: ([, x]) => jmp(s(make("div", make("sinh", x), make("cosh", x)))),
//     asinh: ([, x]) => call(s(x), dx => ret(make("div", dx, make("sqrt", make("add", make("pow", x, make("lit", 2)), make("lit", 1)))))),
//     acosh: ([, x]) => call(s(x), dx => ret(make("div", dx, make("sub", x, make("lit", 1))))),
//     atanh: ([, x]) => call(s(x), dx => ret(make("div", dx, make("sub", make("lit", 1), make("pow", x, make("lit", 2)))))),
//     add: ([, x, y]) => call(s(x), dx => call(s(y), dy => ret(make("add", dx, dy)))),
//     sub: ([, x, y]) => call(s(x), dx => call(s(y), dy => ret(make("sub", dx, dy)))),
//     mul: ([, x, y]) => call(s(x), dx => call(s(y), dy => ret(make("add", make("mul", dx, y), make("mul", x, dy))))),
//     div: ([, x, y]) => call(s(x), dx => call(s(y), dy => ret(make("div", make("sub", make("mul", dx, y), make("mul", x, dy)), make("pow", y, make("lit", 2)))))),
//     pow: ([, x, y]) => call(s(x), dx => call(s(y), dy => ret(make("add", make("mul", make("mul", y, make("pow", x, make("sub", y, make("lit", 1)))), dx), make("mul", make("mul", make("pow", x, y), make("log", x)), dy))))),
//     lt: () => ret(make("lit", 0)),
//     gt: () => ret(make("lit", 0)),
//     le: () => ret(make("lit", 0)),
//     ge: () => ret(make("lit", 0)),
//     if: ([, x, y, z]) => call(s(y), dy => call(s(z), dz => ret(make("if", x, dy, dz)))),
//     ref: ([, j]) => ret(make("lit", j == i ? 1 : 0)),
//     lit: () => ret(make("lit", 0)) })
//   return s(e) })
// export const simplify: (e: Tree) => Tree = e => homproc((call, ret) => {
//   const s: TreeProcess = visit({
//     neg: ([, x]) => call(s(x), dx => dx[0] === "lit" ? ret(make("lit", -dx[1])) : dx[0] === "neg" ? ret(dx[1]) : ret(make("neg", dx))),
//     sqrt: ([, x]) => call(s(x), dx => dx[0] === "lit" ? ret(make("lit", Math.sqrt(dx[1]))) : ret(make("sqrt", dx))),
//     exp: ([, x]) => call(s(x), dx => dx[0] === "lit" ? ret(make("lit", Math.exp(dx[1]))) : ret(make("exp", dx))),
//     log: ([, x]) => call(s(x), dx => dx[0] === "lit" ? ret(make("lit", Math.log(dx[1]))) : ret(make("log", dx))),
//     sin: ([, x]) => call(s(x), dx => dx[0] === "lit" ? ret(make("lit", Math.sin(dx[1]))) : dx[0] === "neg" ? jmp(s(make("neg", make("sin", dx[1])))) : ret(make("sin", dx))),
//     cos: ([, x]) => call(s(x), dx => dx[0] === "lit" ? ret(make("lit", Math.cos(dx[1]))) : dx[0] === "neg" ? jmp(s(make("cos", dx[1]))) : ret(make("cos", dx))),
//     tan: ([, x]) => call(s(x), dx => dx[0] === "lit" ? ret(make("lit", Math.tan(dx[1]))) : dx[0] === "neg" ? jmp(s(make("neg", make("tan", dx[1])))) : ret(make("tan", dx))),
//     asin: ([, x]) => call(s(x), dx => dx[0] === "lit" ? ret(make("lit", Math.asin(dx[1]))) : dx[0] === "neg" ? jmp(s(make("neg", make("asin", dx[1])))) : ret(make("asin", dx))),
//     acos: ([, x]) => call(s(x), dx => dx[0] === "lit" ? ret(make("lit", Math.acos(dx[1]))) : ret(make("acos", dx))),
//     atan: ([, x]) => call(s(x), dx => dx[0] === "lit" ? ret(make("lit", Math.atan(dx[1]))) : dx[0] === "neg" ? jmp(s(make("neg", make("atan", dx[1])))) : ret(make("atan", dx))),
//     atan2: ([, x, y]) => call(s(x), dx => call(s(y), dy => dx[0] === "lit" && dy[0] === "lit" ? ret(make("lit", Math.atan2(dx[1], dy[1]))) : ret(make("atan2", dx, dy)))),
//     sinh: ([, x]) => call(s(x), dx => dx[0] === "lit" ? ret(make("lit", Math.sinh(dx[1]))) : dx[0] === "neg" ? jmp(s(make("neg", make("sinh", dx[1])))) : ret(make("sinh", dx))),
//     cosh: ([, x]) => call(s(x), dx => dx[0] === "lit" ? ret(make("lit", Math.cosh(dx[1]))) : dx[0] === "neg" ? jmp(s(make("cosh", dx[1]))) : ret(make("cosh", dx))),
//     tanh: ([, x]) => call(s(x), dx => dx[0] === "lit" ? ret(make("lit", Math.tanh(dx[1]))) : dx[0] === "neg" ? jmp(s(make("neg", make("tanh", dx[1])))) : ret(make("tanh", dx))),
//     asinh: ([, x]) => call(s(x), dx => dx[0] === "lit" ? ret(make("lit", Math.asinh(dx[1]))) : dx[0] === "neg" ? jmp(s(make("neg", make("asinh", dx[1])))) : ret(make("asinh", dx))),
//     acosh: ([, x]) => call(s(x), dx => dx[0] === "lit" ? ret(make("lit", Math.acosh(dx[1]))) : ret(make("acosh", dx))),
//     atanh: ([, x]) => call(s(x), dx => dx[0] === "lit" ? ret(make("lit", Math.atanh(dx[1]))) : dx[0] === "neg" ? jmp(s(make("neg", make("atanh", dx[1])))) : ret(make("atanh", dx))),
//     add: ([, x, y]) => call(s(x), dx => dx[1] === 0 ? jmp(s(y)) : call(s(y), dy => dx[0] === "lit" && dy[0] === "lit" ? ret(make("lit", dx[1] + dy[1])) : dy[1] === 0 ? ret(dx) : ret(make("add", dx, dy)))),
//     sub: ([, x, y]) => call(s(x), dx => dx[1] === 0 ? call(s(y), dy => jmp(s(make("neg", dy)))) : call(s(y), dy => dx[0] === "lit" && dy[0] === "lit" ? ret(make("lit", dx[1] - dy[1])) : dy[1] === 0 ? ret(dx) : ret(make("sub", dx, dy)))),
//     mul: ([, x, y]) => call(s(x), dx => dx[1] === 0 ? ret(make("lit", 0)) : dx[1] === 1 ? jmp(s(y)) : call(s(y), dy => dx[0] === "lit" && dy[0] === "lit" ? ret(make("lit", dx[1] * dy[1])) : dy[1] === 0 ? ret(make("lit", 0)) : dy[1] === 1 ? ret(dx) : ret(make("mul", dx, dy)))),
//     div: ([, x, y]) => call(s(x), dx => call(s(y), dy => dx[0] === "lit" && dy[0] === "lit" ? ret(make("lit", dx[1] / dy[1])) : dy[1] === 1 ? ret(dx) : ret(make("div", dx, dy)))),
//     pow: ([, x, y]) => call(s(x), dx => call(s(y), dy => dx[0] === "lit" && dy[0] === "lit" ? ret(make("lit", powfix(dx[1], dy[1]))) : dx[1] === 1 || dy[1] === 1 ? ret(dx) : ret(make("pow", dx, dy)))),
//     lt: ([, x, y]) => call(s(x), dx => call(s(y), dy => dx[0] === "lit" && dy[0] === "lit" ? ret(make("lit", dx[1] < dy[1] ? 1 : 0)) : ret(make("lt", dx, dy)))),
//     gt: ([, x, y]) => call(s(x), dx => call(s(y), dy => dx[0] === "lit" && dy[0] === "lit" ? ret(make("lit", dx[1] > dy[1] ? 1 : 0)) : ret(make("gt", dx, dy)))),
//     le: ([, x, y]) => call(s(x), dx => call(s(y), dy => dx[0] === "lit" && dy[0] === "lit" ? ret(make("lit", dx[1] <= dy[1] ? 1 : 0)) : ret(make("le", dx, dy)))),
//     ge: ([, x, y]) => call(s(x), dx => call(s(y), dy => dx[0] === "lit" && dy[0] === "lit" ? ret(make("lit", dx[1] >= dy[1] ? 1 : 0)) : ret(make("ge", dx, dy)))),
//     if: ([, x, y, z]) => call(s(x), dx => dx[0] === "lit" ? jmp(s(dx[1] ? y : z)) : call(s(y), dy => call(s(z), dz => ret(make("if", dx, dy, dz))))),
//     ref: ([, i]) => ret(make("ref", i)),
//     lit: ([, v]) => ret(make("lit", v)) })
//   return s(e) })
//# sourceMappingURL=lang.js.map