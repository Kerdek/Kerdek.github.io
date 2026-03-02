import { di } from "../common/util/di.js";
import { scanner } from "./scanner.js";
const reg = (r, k) => (t) => di(t.match(r), m => !m ? null : [m[0], k]), regf = (r, k, f) => (t) => di(t.match(r), m => !m || f.some(e => e == m[0]) ? null : [m[0], k]), sym = (r) => (t, k) => di(t.match(r), m => !m ? null : [m[0], k === 'top' ? 'symbol' : k === 'proposition' ? 'propositionsymbol' : 'proofsymbol']), 
// symf = <K extends 'top' | 'proposition' | 'proof'>(r: RegExp, f: string[]) =>
//   (t: string, k: K): [string, TokenKind] | null =>
//   di(t.match(r), m =>
//   !m || f.some(e => e == m[0]) ? null : [m[0], k === 'top' ? 'symbol' : k === 'proposition' ? 'propositionsymbol' : 'proofsymbol']),
reg_skip = (r, k) => (t) => di(t.match(r), m => !m ? null :
    [m[0].substring(0, m[0].length - (m[1] || '').length), k]), keys = ['import', 'export', 'define', 'theorem', 'let', 'lemma', 'premise', 'given', 'print'], name = (r, k) => (t) => di(t.match(r), m => m && (keys.some(i => i === m[0]) ? null :
    [m[0], k]));
export const tokenizer = scanner({
    dt: sym(/^\./),
    pp: name(/^[a-zA-Z']+/, 'proposition'),
    pf: name(/^[a-zA-Z0-9\-']+/, 'proof'),
    // ws: reg(/^(\s|--[\s\S]*?(\n|$)|\(\*[\s\S]*?(\*\)|$))*/, 'comment'),
    nl: reg(/^\n/, 'invalid'),
    wl: reg(/^[^\n\S]+/, 'invalid'),
    ch: reg(/^--[^\n]*/, 'comment'),
    cl: reg(/^\(\*/, 'comment'),
    cb: reg(/^(?:[^\n]*?\*\)|[^\n]+)/, 'comment'),
    op: regf(/^[->:=]+/, 'propositionsymbol', [":", ":="]),
    ce: sym(/^:=/),
    cn: sym(/^:/),
    al: sym(/^\\\//),
    lm: sym(/^\\/),
    lp: reg(/^\(/, 'propositionsymbol'),
    rp: reg(/^\)/, 'propositionsymbol'),
    lb: sym(/^\[/),
    rb: sym(/^\]/),
    dv: reg_skip(/^[\s\S]*?(\b(import|export|print|define|theorem)\b|\n|$)/, 'invalid'),
    df: reg(/^\bdefine\b/, 'symbol'),
    pt: sym(/^\bprint\b/),
    ip: reg(/^\bimport\b/, 'symbol'),
    ep: reg(/^\bexport\b/, 'symbol'),
    ui: reg(/^\/\\/, 'proofsymbol'),
    cp: reg(/^\\/, 'proofsymbol'),
    le: reg(/^\blemma\b/, 'proofsymbol'),
    ll: reg(/^\blet\b/, 'proofsymbol'),
    th: reg(/^\btheorem\b/, 'symbol'),
    li: reg(/^"(?:[^"\\]|\\[nt"\\])*"?/, 'proofsymbol')
});
export const token_kinds = [
    'invalid',
    'foreground',
    'proposition',
    'propositionsymbol',
    'proof',
    'proofsymbol',
    'symbol',
    'comment'
];
//# sourceMappingURL=tokenizer.js.map