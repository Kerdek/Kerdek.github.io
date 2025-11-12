import { Run, run } from "./run.js"
import { di } from "./di.js"
import { elm, txt } from "./dom.js"
import { colors } from "./colors.js"
import { TextPosition, TextRange } from "./scanner.js"
import {
  Context,
  Goal,
  Identifier,
  Messages,
  Proposition,
  PropositionGrammar,
  visit_proposition } from "./lang.js"
import { query, reduce } from "./check.js"

const { assign } = Object

type PropositionSyntaxContext = {
  p: 0 | 1 | 2,
  t: 0 | 1 | 2 }

const
  highlight = (c: string) => (s: string) =>
    elm('span', e => {
      assign(e.style, {
        color: c })
      e.append(
        txt(s)) }),

  pp = highlight(colors.proposition),
  pf = highlight(colors.proof),
  pps = highlight(colors.propositionsymbol),
  pfs = highlight(colors.proofsymbol),

  hparens = (c: boolean, s: Node[]) =>
    !c ? s : [pps(`(`), ...s, pps(`)`)],

  proposition = run(
    <P, R>({ proc, call, cc, ret }: Run<Node[], P, R>) => {

    const lambda = proc(({ b }: PropositionGrammar['lam']): R =>
      b.k === 'lam' ?
        call(lambda(b), db =>
        ret([txt(` `), pp(b.i), ...db])) :
      call(main(b, { p: 0, t: 0 }), dx =>
      ret([pps(`.`), ...dx])))

    const main: (tau: Proposition, ctx: PropositionSyntaxContext) => P = proc(visit_proposition({
      lam: ({ i, ...r }, { t }) =>
        di(t > 0, s =>
        call(lambda({ i, ...r }), du =>
        ret(hparens(s, [
          pps(`\\`), pp(i), ...du])))),
      imp: ({ l, r }, { p, t }) =>
        di(p > 0, s =>
        call(main(l, { p: 1, t: 1 }), dl =>
        call(main(r, { p: 0, t: s ? 0 : t }), dr =>
        ret(hparens(s, [
          ...dl, txt(` `), pps(`->`), txt(` `), ...dr]))))),
      app: ({ l, r }, { p, t }) =>
        di(p > 1, s =>
        call(main(l, { p: 1, t: 2 }), dl =>
        call(main(r, { p: 2, t: s ? 0 : t }), dr =>
        ret(hparens(s, [
          ...dl, txt(` `), ...dr]))))),
      ref: ({ i }, {}) =>
        ret([pp(i)]),
      var: ({ d }, ctx) =>
        d[0] ? cc(main(d[0], ctx)) :
        ret([pps(`()`)]),
      err: ({ }, {}) =>
        ret([pps(`()`)]) }))

    return (tau: Proposition) => main(tau, { p: 0, t: 0 }) }),

  pos = (w: TextPosition) =>
    `(${w.line}, ${w.col})`,

  proof_name = (c: Identifier) => [
    pfs(`<`),
    pf(c),
    pfs(`>`)],

  hover = (e: HTMLElement, h: Node[]) => {
    const d = elm('div', e => {
      assign(e.style, {
        padding: "3px",
        borderColor: colors.guide,
        borderStyle: "solid",
        borderWidth: "1px" })
      e.append(...h) })
    const s = new Set<number>()
    e.addEventListener('pointerenter', p0 => {
      const leave = (p1: PointerEvent) => {
        s.delete(p1.pointerId)
        if(s.size === 0) {
          e.removeChild(d) }
        e.removeEventListener('pointerleave', leave) }
      if (!s.has(p0.pointerId)) {
        e.appendChild(d) }
      s.add(p0.pointerId)
      e.addEventListener('pointerleave', leave) }) },

  goal = (pfx: Context, { tau, sigma, rho, pi }: Goal): Node[] => [
    ...pi.length === 0 ? [] : [
      elm('div', e => {
        e.append(...pi.map(i => [pp(i), txt(` `)]).flat(1)) })],
    ...rho.map(({ i, d }) =>
      elm('div', e => {
        hover(e, proposition(query(d, [...pfx.rho, ...rho])))
        e.append(
          pp(i), txt(` `), pfs(`:=`), txt(` `), ...proposition(reduce(d, [...pfx.rho, ...rho]))) })),
    ...sigma.map(({ i, t }) =>
      elm('div', e => {
        hover(e, proposition(query(t, [...pfx.rho, ...rho])))
        e.append(
          ...proof_name(i), txt(` `), pfs(`:`), txt(` `), ...proposition(reduce(t, [...pfx.rho, ...rho]))) })),
    elm('div', e => {
      hover(e, proposition(query(tau, [...pfx.rho, ...rho])))
      e.append(
        pfs(`⊢`), txt(` `), ...proposition(reduce(tau, [...pfx.rho, ...rho]))) })]

export const print_messages = (pfx: Context, g: Messages, curse: (w: TextPosition | TextRange) => void): Node[] =>
  g.map(({ w, m, c }) =>
    elm('div', e => {
      assign(e.style, {
        margin: "3pt",
        padding: "3pt",
        borderColor: colors.guide,
        borderWidth: "1px",
        borderStyle: "solid" })
      e.append(
        elm('div', e => {
          assign(e.style, {
            fontSize: "8pt" })
          e.append(
            elm('span', e => {
              assign(e, {
                title: 'Click to highlight the text.' })
              assign(e.style, {
                color: colors.symbol,
                cursor: 'pointer' })
              e.addEventListener('click', () =>
                curse(w))
              e.append(
                txt(
                  'begin' in w ?
                    `${pos(w.begin)} - ${pos(w.end)}` :
                  pos(w))) }),
            txt(` ${m}`)) }),
        ...c.map(c => elm('div', e => {
            assign(e.style, {
              paddingTop: "3pt",
              borderTopColor: colors.guide,
              borderTopWidth: "1px",
              borderTopStyle: "solid" })
            e.append(...typeof c === 'string' ? [txt(c)] :
              'tau' in c ? goal(pfx, c) :
              proposition(c)) }))) }))

const parens = (c: boolean, s: string) => c ? `(${s})` : s

export const print_proposition = run(
  <P, R>({ proc, call, cc, ret }: Run<string, P, R>) => {

const lambda = proc(({ b }: PropositionGrammar['lam']): R =>
  b.k === 'lam' ?
    call(lambda(b), db =>
    ret(` ${b.i}${db}`)) :
  call(main(b, { p: 0, t: 0 }),
  dx => ret(`.${dx}`)))

const main: (tau: Proposition, ctx: PropositionSyntaxContext) => P = proc(visit_proposition({
  lam: ({ i, ...r }, { t }) =>
    di(t > 0, s =>
    call(lambda({ i, ...r }), du =>
    ret(parens(s, `\\${i}${du}`)))),
  imp: ({ l, r }, { p, t }) =>
    di(p > 0, s =>
    call(main(l, { p: 1, t: 1 }), dl =>
    call(main(r, { p: 0, t: s ? 0 : t }), dr =>
    ret(parens(s, `${dl} -> ${dr}`))))),
  app: ({ l, r }, { p, t }) =>
    di(p > 1, s =>
    call(main(l, { p: 1, t: 2 }), dl =>
    call(main(r, { p: 2, t: s ? 0 : t }), dr =>
    ret(parens(s, `${dl} ${dr}`))))),
  ref: ({ i }, {}) =>
    ret(i),
  var: ({ d }, ctx) =>
    d[0] ? cc(main(d[0], ctx)) :
    ret(`()`),
  err: ({ }, {}) =>
    ret(`()`) }))

return (tau: Proposition) => main(tau, { p: 0, t: 0 }) })

// export const print_goal = ({ tau, sigma, rho, pi }: Goal) => [
// ...pi.length === 0 ? [] : [pi.join(' ')],
// ...rho.map(({ i, d }) => `${i} := ${print_proposition(d)}`),
// ...sigma.map(({ i, t }) => `<${i}> : ${print_proposition(t)}`),
// `⊢ ${print_proposition(tau)}`].join('\n')

// export const print_messages = (g: Messages) => g.map(({ w, c }) =>
// `(${w.line}, ${w.col}) ${
//   typeof c === 'string' ? c :
//   'tau' in c ? `Goal:\n\n${print_goal(c)}\n` :
//   `Proposition:\n\n${print_proposition(c)}\n`}`).join('\n')

// type ProofSyntaxContext = {
// precedence: 0 | 1,
// trailing: 0 | 1 }

// export const print_proof = hom(<P, R>({ proc, call, ret }: Hom<string, P, R>) => {
// const top = () => ({ precedence: 0, trailing: true } as ProofSyntaxCategory)
// const lhs = () => ({ precedence: 0, trailing: false } as ProofSyntaxCategory)
// const universal =
//   proc(<I extends 'explicit' | 'implicit'>({ b }: ProofGrammars[I]['ui']): R =>
//   b.k === 'ui' ?
//     call(universal(b), db =>
//     ret(` ${b.i}${db}`)) :
//   call(main(b, top()), db =>
//   ret(`.${db}`)))
// const main: <I extends 'explicit' | 'implicit'>(eps: ProofGrammars[I][ProofKind], cat: ProofSyntaxCategory) => P = proc(visit_proof({
//   ui: ({ i, ...r }, { trailing }) =>
//     call(universal({ i, ...r }), du =>
//     ret(parens(!trailing, `forall ${i}${du}`))),
//   cp: ({ i, t, b }, { trailing }) =>
//     call(main(b, top()), db =>
//     ret(parens(!trailing, `suppose <${i}>${!t ? `` : ` shows ${print_proposition(t)}`}.${db}`))),
//   df: ({ i, d, b }, { trailing }) =>
//     call(main(b, top()), db =>
//     ret(parens(!trailing, `define ${i} : ${print_proposition(d)}.${db}`))),
//   le: ({ i, t, d, b }, { trailing }) =>
//     call(main(b, top()), db =>
//     call(main(d, top()), dd =>
//     ret(parens(!trailing, `lemma <${i}>${!t ? `` : ` shows ${print_proposition(t)}`}. proof ${dd}.${db}`)))),
//   sp: ({ l, r }, { precedence }) =>
//     call(main(l, lhs()), dl =>
//     ret(parens(precedence > 0, `${dl} [${print_proposition(r)}]`))),
//   mp: ({ l, r }, { precedence, trailing }) =>
//     (surrounded =>
//       call(main(l, lhs()), dl =>
//       call(main(r, { precedence: 1, trailing: surrounded || trailing }), dr =>
//       ret(parens(surrounded, `${dl} ${dr}`)))))(
//     precedence > 0),
//   rf: ({ i }, {}) =>
//     ret(`<${i}>`),
//   er: ({}, {}) =>
//     ret(`()`) }))
// return main })
