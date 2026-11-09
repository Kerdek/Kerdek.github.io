import { Colors } from "../common/colors.js"
import { di } from "../common/util/di.js"
import { TokenT, scanner } from "./scanner.js"

export type TokenKind =
'invalid' |
'type_text' |
'type_symbol' |
'term_text' |
'term_symbol' |
'document_symbol' |
'comment'

export type Token = TokenT<TokenKind>
export type Tokens = Token[]

export type Tokenizer = ReturnType<typeof tokenizer>

const
  reg = (r: RegExp, k: TokenKind) =>
    (t: string): [string, TokenKind] | null =>
    di(t.match(r), m =>
    !m ? null : [m[0], k]),
  regf = (r: RegExp, k: TokenKind, f: string[]) =>
    (t: string): [string, TokenKind] | null =>
    di(t.match(r), m =>
    !m || f.some(e => e == m[0]) ? null : [m[0], k]),
  sym = <K extends 'document_symbol' | 'type_symbol' | 'term_symbol'>(r: RegExp) =>
    (t: string, k: K): [string, TokenKind] | null =>
    di(t.match(r), m =>
    !m ? null : [m[0], k]),
  // symf = <K extends 'top' | 'type_text' | 'term_text'>(r: RegExp, f: string[]) =>
  //   (t: string, k: K): [string, TokenKind] | null =>
  //   di(t.match(r), m =>
  //   !m || f.some(e => e == m[0]) ? null : [m[0], k === 'top' ? 'document_symbol' : k === 'type_text' ? 'type_symbol' : 'term_symbol']),
  reg_skip = (r: RegExp, k: TokenKind) =>
  (t: string): [string, TokenKind] | null =>
    di(t.match(r), m =>
    !m ? null :
    [m[0].substring(0, m[0].length - (m[1] || '').length), k]),
  keys = ['import', 'export', 'define', 'theorem', 'let', 'lemma', 'premise', 'given', 'print'],
  name = (r: RegExp, k: TokenKind) =>
  (t: string): [string, TokenKind] | null =>
    di(t.match(r), m =>
    m && (keys.some(i => i === m[0]) ? null :
    [m[0], k]))

export const tokenizer = scanner({
dt: sym<'document_symbol' | 'type_symbol' | 'term_symbol'>(/^\./),
pp: name(/^[a-zA-Z_']+/, 'type_text'),
pf: name(/^[a-zA-Z0-9_\-']+/, 'term_text'),
nl: reg(/^\n/, 'invalid'),
wl: reg(/^[^\n\S]+/, 'invalid'),
ch: reg(/^--[^\n]*/, 'comment'),
cl: reg(/^\(\*/, 'comment'),
cb: reg(/^(?:[^\n]*?\*\)|[^\n]+)/, 'comment'),
op: regf(/^[->:=]+/, 'type_symbol', [":", ":="]),
ce: sym<'document_symbol' | 'term_symbol'>(/^:=/),
cn: sym<'document_symbol' | 'term_symbol'>(/^:/),
al: sym<'term_symbol' | 'type_symbol'>(/^\\\//),
lm: sym<'term_symbol' | 'type_symbol'>(/^\\/),
lp: reg(/^\(/, 'type_symbol'),
rp: reg(/^\)/, 'type_symbol'),
lb: sym<'term_symbol'>(/^\[/),
rb: sym<'term_symbol'>(/^\]/),
dv: reg_skip(/^[\s\S]*?(\b(import|export|print|define|theorem)\b|\n|$)/, 'invalid'),
df: reg(/^\bdefine\b/, 'document_symbol'),
pt: sym<'document_symbol' | 'term_symbol'>(/^\bprint\b/),
ip: reg(/^\bimport\b/, 'document_symbol'),
ep: reg(/^\bexport\b/, 'document_symbol'),
ui: reg(/^\/\\/, 'term_symbol'),
cp: reg(/^\\/, 'term_symbol'),
le: reg(/^\blemma\b/, 'term_symbol'),
ll: reg(/^\blet\b/, 'term_symbol'),
th: reg(/^\btheorem\b/, 'document_symbol'),
li: reg(/^"(?:[^"\\]|\\[nt"\\])*"?/, 'term_symbol') })

export const token_kinds: (keyof Colors)[] = [
'invalid',
'foreground',
'type_text',
'type_symbol',
'term_text',
'term_symbol',
'document_symbol',
'comment']
