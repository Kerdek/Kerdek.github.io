import { Colors, colors, mode } from "./colors.js"
import { read_article_tokens } from "./read.js"
import { tokenizer } from "./tokenizer.js"

await document.fonts.ready

await new Promise(cb => {
  const js = document.createElement('script')
  js.src = '../monaco/vs/loader.js'
  js.type = 'text/javascript'
  js.addEventListener('load', cb)
  document.head.appendChild(js) })

require.config({
  paths: {
    vs: new URL(`${document.documentURI}/../../monaco/vs`).toString() } })

await new Promise(cb => require(['vs/editor/editor.main'], cb))

monaco.languages.register({ id: 'semity' })

monaco.languages.setLanguageConfiguration('semity', {
  comments: {
    lineComment: "--",
    blockComment: ["(*", "*)"] },
  brackets: [
    ["(", ")"],
    ["[", "]"] ],
  colorizedBracketPairs: [],
  autoClosingPairs: [
    { open: "(", close: ")" },
    { open: "[", close: "]" },
    { open: "(*", close: "*)" } ],
  surroundingPairs: [
    { open: "(", close: ")" },
    { open: "[", close: "]" },
    { open: "(*", close: "*)" } ],
  folding: { "markers":
    { start: /\(/, end: /\)/ } } })

export const token_kinds: (keyof Colors)[] = [
  'invalid',
  'foreground',
  'proposition',
  'propositionsymbol',
  'proof',
  'proofsymbol',
  'symbol',
  'comment']

monaco.languages.registerDocumentSemanticTokensProvider('semity', {
getLegend: () => (
  { tokenTypes: [...token_kinds], tokenModifiers: [] }),
provideDocumentSemanticTokens: (model, _resultId, _token) => ({
  data: new Uint32Array(read_article_tokens(tokenizer(model.getValue(), { line: 1, col: 1 })).reduce<[number[], number, number]>(
    ([a, l, c], b) => (a.push(b.w.begin.line - l, b.w.begin.line === l ? b.w.begin.col - c : b.w.begin.col - 1, b.w.end.col - b.w.begin.col, token_kinds.indexOf(b.type), 0), [a, b.w.begin.line, b.w.begin.col]), [[], 1, 1])[0]) }),
releaseDocumentSemanticTokens(_resultId) { } })

monaco.editor.defineTheme('semity', {
  base: mode === "dark" ? 'hc-black' : 'vs',
  inherit: true,
  rules: token_kinds.map(token => ({ token, foreground: colors[token] })),
  colors: {
    "editor.lineHighlightBackground": colors.lineHighlight,
    "editorRuler.foreground": colors.ruler,
    "editorIndentGuide.background1": colors.guide,
    "editorIndentGuide.background2": colors.guide,
    "editorIndentGuide.background3": colors.guide,
    "editorIndentGuide.background4": colors.guide,
    "editorIndentGuide.background5": colors.guide,
    "editorIndentGuide.background6": colors.guide,
    "editorIndentGuide.activeBackground1": colors.foreground,
    "editorIndentGuide.activeBackground2": colors.foreground,
    "editorIndentGuide.activeBackground3": colors.foreground,
    "editorIndentGuide.activeBackground4": colors.foreground,
    "editorIndentGuide.activeBackground5": colors.foreground,
    "editorIndentGuide.activeBackground6": colors.foreground, } })

monaco.editor.setTheme('semity')

const config: monaco.editor.IStandaloneEditorConstructionOptions = {
  matchBrackets: "always",
  fontSize: 16,
  rulers: [20, 40],
  language: 'semity',
  inlineSuggest: { enabled: false },
  quickSuggestions: false,
  minimap: {
    enabled: false },
  fontFamily: 'CMU Typewriter Text',
  tabSize: 2,
  insertSpaces: true,
  automaticLayout: true,
  "semanticHighlighting.enabled": true }

export const create_editor = (e: HTMLElement) =>
  monaco.editor.create(e, config)
