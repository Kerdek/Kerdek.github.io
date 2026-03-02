import { run } from './run.js';
import { di, mod } from '../common/util/di.js';
import { elm, txt } from '../common/util/dom.js';
import { top_border } from '../common/panes/ui.js';
import { colors } from '../common/colors.js';
import { visit_proposition } from './abstract.js';
import { reduce } from './check.js';
const { assign } = Object;
const highlight_text = (c) => (s) => `<span style='color:${c};'>${escapeHTML(s)}</span>`, highlight = (c) => (s) => mod(elm('span'), e => {
    assign(e.style, {
        color: c
    });
    e.append(txt(s));
}), hparens = ({ pps: tys }, c, s) => !c ? s : [tys(`(`), ...s, tys(`)`)], pos = (w) => `(${w.line}, ${w.col})`;
export const escapeHTML = (s) => s.replace(/[\u00A0-\u9999<>\&\\]/g, i => '&#' + i.charCodeAt(0) + ';'), highlight_text_format = {
    pp: highlight_text(colors.proposition),
    pf: highlight_text(colors.proof),
    pps: highlight_text(colors.propositionsymbol),
    pfs: highlight_text(colors.proofsymbol),
    div: (...x) => `${x.join('')}\n`,
    par: (...x) => `${x.join('')}\n`,
    txt: x => x,
    typ: x => x
}, html_format = {
    pp: highlight(colors.proposition),
    pf: highlight(colors.proof),
    pps: highlight(colors.propositionsymbol),
    pfs: highlight(colors.proofsymbol),
    div: (...x) => mod(elm('div'), e => { assign(e.style, { ...top_border }), e.append(...x); }),
    par: (...x) => mod(elm('div'), e => { e.append(...x); }),
    txt: txt,
    typ: txt
}, text_format = {
    pp: x => x,
    pf: x => x,
    pps: x => x,
    pfs: x => x,
    div: (...x) => `${x.join('')}\n`,
    par: (...x) => `${x.join('')}\n`,
    txt: x => x,
    typ: x => x
};
export const print_proposition = (f) => run(({ proc, call, cc, ret }) => {
    const { pp, pps, txt } = f, universal = proc(({ b }) => b.k === 'uni' ?
        call(universal(b), db => ret([txt(` `), pp(b.i), ...db])) :
        call(main(b, { p: 0, t: 0 }), dx => ret([pps(`.`), ...dx]))), lambda = proc(({ b }) => b.k === 'lam' ?
        call(lambda(b), db => ret([txt(` `), pp(b.i), ...db])) :
        call(main(b, { p: 0, t: 0 }), dx => ret([pps(`.`), ...dx]))), main = proc(visit_proposition({
        uni: ({ i, ...r }, { t }) => di(t > 0, s => call(universal({ i, ...r }), du => ret(hparens(f, s, [
            pps(`\\/`), pp(i), ...du
        ])))),
        lam: ({ i, ...r }, { t }) => di(t > 0, s => call(lambda({ i, ...r }), du => ret(hparens(f, s, [
            pps(`\\`), pp(i), ...du
        ])))),
        imp: ({ l, r }, { p, t }) => di(p > 0, s => call(main(l, { p: 1, t: 1 }), dl => call(main(r, { p: 0, t: s ? 0 : t }), dr => ret(hparens(f, s, [
            ...dl, txt(` `), pps(`->`), txt(` `), ...dr
        ]))))),
        app: ({ l, r }, { p, t }) => di(p > 1, s => call(main(l, { p: 1, t: 2 }), dl => call(main(r, { p: 2, t: s ? 0 : t }), dr => ret(hparens(f, s, [
            ...dl, txt(` `), ...dr
        ]))))),
        ref: ({ i }, {}) => ret([pp(i)]),
        var: ({ d }, ctx) => d[0] ? cc(main(d[0], ctx)) :
            ret([pps(`()`)]),
        err: ({}, {}) => ret([pps(`()`)])
    }));
    return (tau) => main(reduce(tau), { p: 0, t: 0 });
}), print_goal = (f) => ({ tau, sigma, rho, pi, hi }) => {
    const { pp, pf, pfs, par, txt } = f, ppf = print_proposition(f);
    return [
        ...hi.length === 0 ? [] : [
            par(pfs(`{`), txt(` `), ...hi.map(i => [pp(i), txt(` `)]).flat(1), txt(` `), pfs(`}`))
        ],
        ...pi.length === 0 ? [] : [
            par(...pi.map(i => [pp(i), txt(` `)]).flat(1))
        ],
        ...rho.map(({ i, d }) => par(pp(i), txt(` `), pfs(`:=`), txt(` `), ...ppf(d))),
        ...sigma.map(({ i, t }) => par(pf(i), txt(` `), pfs(`:`), txt(` `), ...ppf(t))),
        par(pfs(`⊢`), txt(` `), ...ppf(tau))
    ];
}, print_message_contents = (f) => {
    const { txt, div } = f, goal = print_goal(f), prop = print_proposition(f);
    return (c) => div(...typeof c === 'string' ? [txt(c)] :
        'tau' in c ? goal(c) :
            prop(c));
};
export const print_messages = (g, curse) => g.map(({ w, m, c }) => mod(elm('div'), e => {
    assign(e.style, {
        margin: '3pt',
        padding: '3pt',
        borderColor: colors.guide,
        borderWidth: '1px',
        borderStyle: 'solid'
    });
    e.append(mod(elm('div'), e => {
        assign(e.style, {
            fontSize: '8pt'
        });
        e.append(mod(elm('span'), e => {
            assign(e, {
                title: 'Click to highlight the text.'
            });
            assign(e.style, {
                color: colors.symbol,
                cursor: 'pointer'
            });
            e.addEventListener('click', () => curse(w));
            e.append(txt('begin' in w ?
                `${pos(w.begin)} - ${pos(w.end)}` :
                pos(w)));
        }), txt(` ${m}`));
    }), ...c.map(print_message_contents(html_format)));
}));
//# sourceMappingURL=print.js.map