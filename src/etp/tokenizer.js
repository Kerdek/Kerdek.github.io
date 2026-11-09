import { di } from "../common/util/di.js";
import { scanner } from "./scanner.js";
const reg = (r, k) => (t) => di(t.match(r), m => !m ? null : [m[0], k]), regf = (r, k, f) => (t) => di(t.match(r), m => !m || f.some(e => e == m[0]) ? null : [m[0], k]), sym = (r) => (t, k) => di(t.match(r), m => !m ? null : [m[0], k]), 
// symf = <K extends 'top' | 'type_text' | 'term_text'>(r: RegExp, f: string[]) =>
//   (t: string, k: K): [string, TokenKind] | null =>
//   di(t.match(r), m =>
//   !m || f.some(e => e == m[0]) ? null : [m[0], k === 'top' ? 'document_symbol' : k === 'type_text' ? 'type_symbol' : 'term_symbol']),
reg_skip = (r, k) => (t) => di(t.match(r), m => !m ? null :
    [m[0].substring(0, m[0].length - (m[1] || '').length), k]), keys = ['import', 'export', 'define', 'theorem', 'let', 'lemma', 'premise', 'given', 'print'], name = (r, k) => (t) => di(t.match(r), m => m && (keys.some(i => i === m[0]) ? null :
    [m[0], k]));
export const tokenizer = scanner({
    dt: sym(/^\./),
    pp: name(/^[a-zA-Z']+/, 'type_text'),
    pf: name(/^[a-zA-Z0-9\-']+/, 'term_text'),
    // ws: reg(/^(\s|--[\s\S]*?(\n|$)|\(\*[\s\S]*?(\*\)|$))*/, 'comment'),
    nl: reg(/^\n/, 'invalid'),
    wl: reg(/^[^\n\S]+/, 'invalid'),
    ch: reg(/^--[^\n]*/, 'comment'),
    cl: reg(/^\(\*/, 'comment'),
    cb: reg(/^(?:[^\n]*?\*\)|[^\n]+)/, 'comment'),
    op: regf(/^[->:=]+/, 'type_symbol', [":", ":="]),
    ce: sym(/^:=/),
    cn: sym(/^:/),
    al: sym(/^\\\//),
    lm: sym(/^\\/),
    lp: reg(/^\(/, 'type_symbol'),
    rp: reg(/^\)/, 'type_symbol'),
    lb: sym(/^\[/),
    rb: sym(/^\]/),
    dv: reg_skip(/^[\s\S]*?(\b(import|export|print|define|theorem)\b|\n|$)/, 'invalid'),
    df: reg(/^\bdefine\b/, 'document_symbol'),
    pt: sym(/^\bprint\b/),
    ip: reg(/^\bimport\b/, 'document_symbol'),
    ep: reg(/^\bexport\b/, 'document_symbol'),
    ui: reg(/^\/\\/, 'term_symbol'),
    cp: reg(/^\\/, 'term_symbol'),
    le: reg(/^\blemma\b/, 'term_symbol'),
    ll: reg(/^\blet\b/, 'term_symbol'),
    th: reg(/^\btheorem\b/, 'document_symbol'),
    li: reg(/^"(?:[^"\\]|\\[nt"\\])*"?/, 'term_symbol')
});
export const token_kinds = [
    'invalid',
    'foreground',
    'type_text',
    'type_symbol',
    'term_text',
    'term_symbol',
    'document_symbol',
    'comment'
];
//# sourceMappingURL=tokenizer.js.map