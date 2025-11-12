import { di } from "./di.js";
import { scanner } from "./scanner.js";
const reg = (r, k) => (t) => di(t.match(r), m => !m ? null : [m[0], k]), regf = (r, k, f) => (t) => di(t.match(r), m => !m || f.some(e => e == m[0]) ? null : [m[0], k]), sym = (r) => (t, k) => di(t.match(r), m => !m ? null : [m[0], k === 'top' ? 'symbol' : k === 'proposition' ? 'propositionsymbol' : 'proofsymbol']), 
// symf = <K extends 'top' | 'proposition' | 'proof'>(r: RegExp, f: string[]) =>
//   (t: string, k: K): [string, TokenKind] | null =>
//   di(t.match(r), m =>
//   !m || f.some(e => e == m[0]) ? null : [m[0], k === 'top' ? 'symbol' : k === 'proposition' ? 'propositionsymbol' : 'proofsymbol']),
reg_skip = (r, k) => (t) => di(t.match(r), m => !m ? null :
    [m[0].substring(0, m[0].length - (m[1] || '').length), k]), keys = ['define', 'theorem', 'let', 'lemma', 'premise', 'given', 'print'], name = (r, k) => (t) => di(t.match(r), m => m && (keys.some(i => i === m[0]) ? null :
    [m[0], k]));
export const tokenizer = scanner({
    sfl: reg(/^[^\n]*\n?/, 'comment'),
    dt: sym(/^\./),
    pp: name(/^[\w']+/, 'proposition'),
    pf: name(/^([\w']|[^\n\S])+/, 'proof'),
    // ws: reg(/^(\s|--[\s\S]*?(\n|$)|\(\*[\s\S]*?(\*\)|$))*/, 'comment'),
    nl: reg(/^\n/, 'invalid'),
    wl: reg(/^[^\n\S]+/, 'invalid'),
    ch: reg(/^--[^\n]*/, 'comment'),
    cl: reg(/^\(\*/, 'comment'),
    cb: reg(/^(?:[^\n]*?\*\)|[^\n]+)/, 'comment'),
    op: regf(/^[->:=]+/, 'propositionsymbol', [":", ":="]),
    ce: sym(/^:=/),
    cn: sym(/^:/),
    lm: sym(/^\\/),
    lp: reg(/^\(/, 'propositionsymbol'),
    rp: reg(/^\)/, 'propositionsymbol'),
    lb: sym(/^\[/),
    rb: sym(/^\]/),
    la: sym(/^\</),
    ra: sym(/^\>/),
    dv: reg_skip(/^[\s\S]*?(\b(define|print|theorem)\b|\n|$)/, 'invalid'),
    df: reg(/^\bdefine\b/, 'symbol'),
    pt: sym(/^\bprint\b/),
    cp: reg(/^\bpremise\b/, 'proofsymbol'),
    le: reg(/^\blemma\b/, 'proofsymbol'),
    ui: reg(/^\bgiven\b/, 'proofsymbol'),
    ll: reg(/^\blet\b/, 'proofsymbol'),
    th: reg(/^\btheorem\b/, 'symbol')
});
//# sourceMappingURL=tokenizer.js.map