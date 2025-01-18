import { playground_colors, create_playground } from './create_playground.js'

document.title = 'Lambda Calculus'

const style_rule: (x: string) => number = (() => {
  const style = document.head.appendChild(document.createElement('style'))
  const ss = style.sheet
  return ss ? x => ss.insertRule(x, 0) : () => -1 })()

style_rule(`@font-face {
  font-family: CMU Typewriter Text;
  src: url("../cmuntt.ttf"); }`)
style_rule(`:root {
  --contrast: ${playground_colors.contrast};
  --invalid: ${playground_colors.invalid};
  --reference: ${playground_colors.reference};
  --lambda: ${playground_colors.lambda};
  --brackets: ${playground_colors.brackets};
  --string: ${playground_colors.string};
  --numerical: ${playground_colors.numerical};
  --comment: ${playground_colors.comment};
  --lineHighlight: ${playground_colors.lineHighlight};
  --ruler: ${playground_colors.ruler};
  --guide: ${playground_colors.guide};}`)
style_rule(`body {
  font-family: CMU Typewriter Text;
  font-size: 14pt;
  text-align: center;
  margin-left: 1.5in;
  margin-top: 0.5in;
  margin-right: 1.5in; }`)
style_rule(`@media (prefers-color-scheme: light) {
  body {
    background: white;
    color: black;
    caret-color: black; } }`)
style_rule(`@media (prefers-color-scheme: dark) {
  body {
    background: black;
    color: white;
    caret-color: white; } }`)

const playground: (text: string) => HTMLElement = text => {
  const [pg] = create_playground(text)
  pg.style.borderStyle = "solid"
  pg.style.borderColor = "var(--contrast)"
  pg.style.borderWidth = "1px"
  pg.style.width = "75%"
  pg.style.height = "350pt"
  return pg }

type CreateElement = <K extends keyof HTMLElementTagNameMap>(tag: K, mod: (this: HTMLElementTagNameMap[K]) => void, children: Node[]) => HTMLElementTagNameMap[K]
const create_element: CreateElement = (tag, mod, children) => {
  const elem = document.createElement(tag)
  mod.apply(elem)
  elem.append(...children)
  return elem }

const t: (s: string) => Text = s => document.createTextNode(s)

const br = () => document.createElement('br')
const par: (...elems: Node[]) => HTMLParagraphElement = (...elems) => create_element('p', function () {}, elems)

const header = create_element('h1', function () {}, [
  t(`Lambda Calculus`) ])

const intro = par(
  t(`Lambda calculus is a programming language used by Alonzo Church to describe his theory of computation. Its only features are the abilities to define and use functions. It serves as a good proving ground for the design of interpreters, compilers, and other programming languages.`))

const grammar_remark = par(
  t(`The following is an unambiguous BNF grammar for the syntax of lambda calculus.`))

type IndentedParagraph = (...elems: Node[]) => HTMLParagraphElement
const indented_paragraph: IndentedParagraph = (...elems) => create_element('p', function () {
  this.style.textIndent = "-30pt"
  this.style.paddingLeft = "30pt" },
  elems)


const grammar_ref: (text: string) => HTMLSpanElement = text => create_element('span', function() {}, [
  create_element('span', function () { this.style.color = "var(--lambda)" }, [t('<')]),
  create_element('span', function () { this.style.color = "var(--reference)"}, [t(text)]),
  create_element('span', function () { this.style.color = "var(--lambda)" }, [t('>')])])

const grammar_str: (text: string) => HTMLSpanElement = text => create_element('span', function() {}, [
  create_element('span', function () { this.style.color = "var(--lambda)" }, [t('"')]),
  create_element('span', function () { this.style.color = "var(--string)" }, [t(text)]),
  create_element('span', function () { this.style.color = "var(--lambda)" }, [t('"')])])

const grammar_equal: () => HTMLSpanElement = () => create_element('span', function() {}, [
  create_element('span', function () { this.style.color = "var(--lambda)" }, [t('::=')])])

const grammar_dots: () => HTMLSpanElement = () => create_element('span', function() {}, [
  create_element('span', function () { this.style.color = "var(--lambda)" }, [t('...')])])

const grammar_or: () => HTMLSpanElement = () => create_element('span', function() {}, [
  create_element('span', function () { this.style.color = "var(--brackets)" }, [t('|')])])

const grammar_box = create_element('div', function() {
  this.style.display = "inline-block"
  this.style.textAlign = "left" }, [
  indented_paragraph(grammar_ref(`primaryt`), t(' '), grammar_equal(), br(), grammar_str("λ"), t(' '), grammar_ref(`parameters`), t(' '), grammar_or(), br(), grammar_str("("), t(' '), grammar_ref("expressionft"), t(` `), grammar_str(")"), t(` `), grammar_or(), br(), grammar_ref(`id`)),
  indented_paragraph(grammar_ref(`primaryf`), t(' '), grammar_equal(), br(), grammar_str("("), t(' '), grammar_str("λ"), t(' '), grammar_ref(`parameters`), t(' '), grammar_str(")"), t(' '), grammar_or(), br(), grammar_str("("), t(' '), grammar_ref("expressionft"), t(' '), grammar_str(")"), t(' '), grammar_or(), br(), grammar_ref("id")),
  indented_paragraph(grammar_ref(`expressiontt`), t(' '), grammar_equal(), br(), grammar_ref("primaryt"), t(` `), grammar_or(), br(), grammar_str("("), t(' '), grammar_ref("expressionff"), t(' '), grammar_ref("expressiontt"), t(' '), grammar_str(")")),
  indented_paragraph(grammar_ref(`expressiontf`), t(' '), grammar_equal(), br(), grammar_ref("primaryf"), t(` `), grammar_or(), br(), grammar_str("("), t(' '), grammar_ref("expressionff"), t(' '), grammar_ref("expressiontt"), t(' '), grammar_str(")")),
  indented_paragraph(grammar_ref(`expressionft`), t(' '), grammar_equal(), br(), grammar_ref("primaryt"), t(` `), grammar_or(), br(), grammar_ref("expressionff"), t(' '), grammar_ref("expressiontt")),
  indented_paragraph(grammar_ref(`expressionff`), t(' '), grammar_equal(), br(), grammar_ref("primaryf"), t(` `), grammar_or(), br(), grammar_ref("expressionff"), t(' '), grammar_ref("expressiontf")),
  indented_paragraph(grammar_ref(`parameters`), t(' '), grammar_equal(), br(), grammar_ref("id"), t(' '), grammar_ref("parameters"), t(' '), grammar_or(), br(), grammar_ref("id"), t(' '), grammar_str("."), t(' '), grammar_ref("expressionft")),
  indented_paragraph(grammar_ref(`id`), t(' '), grammar_equal(), t(' '), grammar_str("a"), t(' '), grammar_or(), t(' '), grammar_str("b"), t(' '), grammar_or(), t(' '), grammar_str("c"), t(' '), grammar_or(), t(' '), grammar_dots())])

const ambiguity_remark = par(
  t(`Try to collect these two points from that:`))

const rules_box = create_element('div', function() {
  this.style.display = "inline-block"
  this.style.textAlign = "left" }, [
  t(`1. \`λa.a a\` means \`λa.(a a)\`, not \`(λa.a) a\`. Abstractions obey the maximal munch principle.`),
  br(),
  t(`2. \`a a a\` means \`(a a) a\`, not \`a (a a)\`. Application is left-associative.`)])

const eval_rules = par(
  t(`The rules are simple. When the term in question is an application of an abstraction, it is reduced by manner of substitution. (press \`Evaluate\` in the following box). Such a term is called a redex, meaning it's a candidate for a reduction step.`))

const pg0 = playground('(λa b.b) "foo" "bar"')

const substitution_remark = par(
  t("This is just like when you were asked to substitute variables into equations in grade school. Ben Lynn uses the follwing example. With the help of some built-in arithmetic, we can see that `(λx y.sqrt (add (mul x x) (mul y y))) 3 4` means to substitute `x = 3` and `y = 4` in `sqrt (add (mul x x) (mul y y))`."))

const pg1 = playground("#\"lib/builtin_arithmetic.lm\"λadd sub mul div eq neq gt lt ge le.\n#\"lib/builtin_math.lm\"λpi sqrt log exp sin cos tan asin acos atan atan2 sinh cosh tanh asinh acosh atanh.\n\n(λx y.sqrt (add (mul x x) (mul y y))) 3 4")

const problems_remark = create_element('p', function () {}, [
  t("Problems occur when substituting inside an abstraction because the abstraction could bind variables which appear only after substitution. This problem can be solved by renaming variables as required during subsitution.") ])

const case_remark = create_element('p', function () {}, [
  t("Consider the case of \`(λx y.x) y z\`. This should evaluate to \`y\`. If we walk the argument subtree for `y` then we've gone into an irrelevant scope.") ])

const steps_box = create_element('div', function() {
  this.style.display = "inline-block"
  this.style.textAlign = "left" }, [
  t(`(λx y.x) y z`),
  br(),
  t(`(λy.y) z`),
  br(),
  t(`z`)])

const alternative_remark = create_element('p', function () {}, [
  t("If we are willing to limit which terms we consider a redex, a method involving barriers which forbids such walks can give some of the same normal forms. It enables more normal forms for abstractions, and many are equivalent to other normal forms. The other normal forms are unchanged.") ])

const steps_box2 = create_element('div', function() {
  this.style.display = "inline-block"
  this.style.textAlign = "left" }, [
  t(`(λx y.x) y z`),
  br(),
  t(`(λy.(*y)) z`),
  br(),
  t(`*y`),
  br(),
  t(`y`)])

const interpreter_remark = create_element('p', function () {}, [
  t("The interpreter created for these demos works on that principle. It does not consider any redex other than the topmost. It is also convenient that barriers are the only places where sharing takes place if copies are interned.") ])

const let_remark = create_element('p', function () {}, [
  t("A lovely incantation introduces a combinator which we can use like a `let`.") ])

const pg2 = playground("#\"lib/builtin_arithmetic.lm\"λadd sub mul div eq neq gt lt ge le.\n#\"lib/builtin_math.lm\"λpi sqrt log exp sin cos tan asin acos atan atan2 sinh cosh tanh asinh acosh atanh.\n\n(λa.a a) (λx f.f x) λlet.\n\nlet (λx.mul x x) λsquare.\nlet (λx y.sqrt (add (square x) (square y))) λhypotenuse.\n\nhypotenuse 3 4")

const io_remark = create_element('p', function () {}, [
  t("We can also add IO support and create an IO monad without changing any existing parts (press `Run` in the following box, then click the output area and start typing). This works by mapping normal forms which are cons cells to various operations, one of which is a monadic bind.") ])

const pg3 = playground("#\"lib/preamble.lm\"λlet id car cdr head tail cons compose composer.\n#\"lib/builtin_arithmetic.lm\"λadd sub mul div eq neq gt lt ge le.\n#\"lib/builtin_logic.lm\"λrec if.\n#\"lib/io_playground_console.lm\"λprint get put unput.\n#\"lib/io_sequencing.lm\"λyield return bind bindr do.\n\nlet (rec λf.\n  bind get λx.\n  if (eq x \"Enter\") (\n    return true) $\n  f) λwaitforenter.\n  \n\ndo (print \"hi. tap here and press enter.\") $\ndo (waitforenter) $\ndo (print \"thank you for pressing enter. goodbye.\") $\nreturn true")

const sophisticated_remark = create_element('p', function() {}, [
  t("We can write very small programs which do complex io tasks. This one will accept your input string and print it out in reverse.") ])

const pg4 = playground("#\"lib/preamble.lm\"λlet id car cdr head tail cons compose composer.\n#\"lib/builtin_logic.lm\"λrec if.\n#\"lib/builtin_arithmetic.lm\"λadd sub mul div eq neq gt lt ge le.\n#\"lib/io_playground_console.lm\"λprint get put unput.\n#\"lib/io_sequencing.lm\"λyield return bind bindr do.\n\nrec (λf s.\n  bind get λx.\n  if (eq x \"Enter\") (\n    do (put (add \"\\n\" $ add s \"\\n\")) $\n    f \"\") $\n  if (eq x \"Escape\") (\n    put \"\\nThanks for using reverser.\\n\") $\n  do (put x) $\n  f (add x s)) \"\"")

const self_parse_remark = create_element('p', function() {}, [
  t("We can even parse and format lambda calculus with lambda calculus.") ])

const pg5 = playground("#\"lib/preamble.lm\"\\let id car cdr head tail cons compose composer.\n#\"lib/io_playground_console.lm\"\\print get put unput.\n#\"lib/io_sequencing.lm\"\\yield return bind bindr do.\n#\"lib/io_fetch.lm\"\\fetch.\n#\"lib/builtin_arithmetic.lm\"\\add sub mul div eq neq gt lt ge le.\n#\"lib/lc.lm\"\\read _ format pretty.\n\n\nbind (fetch \"lib/small_program.lc\") λtext.\nread text\n  (λx.do (put $ pretty 0 true x) $ put \"\\n\")\n  print\n")

document.body.append(
  header,
  intro,
  grammar_remark,
  grammar_box,
  ambiguity_remark,
  rules_box,
  eval_rules,
  pg0,
  substitution_remark,
  pg1,
  problems_remark,
  case_remark,
  steps_box,
  alternative_remark,
  steps_box2,
  interpreter_remark,
  let_remark,
  pg2,
  io_remark,
  pg3,
  sophisticated_remark,
  pg4,
  self_parse_remark,
  pg5)
