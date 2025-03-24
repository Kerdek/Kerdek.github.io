import { read } from './read.js'
import { evaluate } from './evaluate.js'
import { print } from './print.js'

const include: (type: string, src: string) => Promise<Event> =
(type, src) => new Promise(cb => {
  const js = document.createElement('script')
  js.src = src
  js.type = type
  js.addEventListener('load', cb)
  document.head.appendChild(js) })

await include('text/javascript', '../monaco/loader.js')
require.config({ paths: { vs: '../monaco' } })
await new Promise (cb => require(['vs/editor/editor.main'], cb))

const church_monarch_tokens: IMonarchLanguage = {
  brackets: [
    { open: "(", close: ")", token: "brackets"} ],
  unicode: true,
  includeLF: true,
  defaultToken: "invalid",
  ignoreCase: false,
  operators: [],
  symbols: /\\|λ|\*|\.|#/,
  tokenizer: {
    root: [
      [/[()]/, 'brackets'],
      [/\\|λ|->|\./, 'lambda'],
      [/[^\s\\λ\.\(\)->]+/, 'reference']] } }

const church_language_config: LanguageConfiguration = {
  brackets: [
    ["(", ")"] ],
  autoClosingPairs: [
    { open: "(", close: ")" } ],
  surroundingPairs: [
    { open: "(", close: ")" } ],
  folding: { "markers": { start: /\(/, end: /\)/ } } }

const church_editor_config: IStandaloneEditorConstructionOptions = {
  bracketPairColorization: {
    enabled: true },
  matchBrackets: "always",
  fontSize: 18,
  rulers: [40, 80],
  language: 'church',
  minimap: {
    enabled: false },
    // maxColumn: 80 },
  fontFamily: 'CMU Typewriter Text',
  tabSize: 2,
  insertSpaces: true,
  automaticLayout: true }

const use_dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
export const playground_colors_dark = {
  'contrast': '#FFFFFF',
  'invalid': '#FF0000',
  'reference': '#FFAACC',
  'lambda': '#AA2255',
  'brackets': '#5522AA',
  'string': '#AAAAFF',
  'numerical': '#AAFFAA',
  'comment': '#55AA55',
  "lineHighlight": '#1b040a',
  "ruler": "#002222",
  "guide": "#555555" }
export const playground_colors_light = {
  'contrast': '#000000',
  'invalid': '#FF0000',
  'reference': '#471127',
  'lambda': '#8f0b3c',
  'brackets': '#3c1085',
  'string': '#151554',
  'numerical': '#126e12',
  'comment': '#339133',
  "lineHighlight": "#e0baca",
  "ruler": "#ccffff",
  "guide": "#AAAAAA" }

export const playground_colors = use_dark ? playground_colors_dark : playground_colors_light

const church_theme: IStandaloneThemeData = {
  base: use_dark ? 'hc-black' : 'vs',
  inherit: true,
  rules: [
    { token: 'invalid', foreground: playground_colors.invalid },
    { token: 'reference', foreground: playground_colors.reference },
    { token: 'lambda', foreground: playground_colors.lambda },
    { token: 'brackets', foreground: playground_colors.brackets },
    { token: 'string', foreground: playground_colors.string },
    { token: 'numerical', foreground: playground_colors.numerical },
    { token: 'comment', foreground: playground_colors.comment } ],
  colors: {
    "editor.lineHighlightBackground": playground_colors.lineHighlight,
    "editorRuler.foreground": playground_colors.ruler,
    "editorIndentGuide.background": playground_colors.guide } }

monaco.languages.register({ id: 'church' })
monaco.languages.setMonarchTokensProvider('church', church_monarch_tokens)
monaco.languages.setLanguageConfiguration('church', church_language_config)
monaco.editor.defineTheme('church', church_theme)
monaco.editor.setTheme('church')

type CreateElement = <K extends keyof HTMLElementTagNameMap>(tag: K, mod: (this: HTMLElementTagNameMap[K]) => void, children: Node[]) => HTMLElementTagNameMap[K]
const create_element: CreateElement = (tag, mod, children) => {
  const elem = document.createElement(tag)
  mod.apply(elem)
  elem.append(...children)
  return elem }

const t: (s: string) => Text = s => document.createTextNode(s)

type Button = (text: string, title: string, action: () => void) => HTMLElement
const button: Button = (text, title, action) => create_element('div',
  function () {
    this.title = title
    this.style.paddingRight = '13pt'
    this.addEventListener('mouseenter', () =>
      this.style.color = playground_colors.lambda)
    this.addEventListener('mouseleave', () =>
      this.style.color = 'revert')
    this.addEventListener('click', action) }, [
  t(text)])

export function create_playground(initial: string): [HTMLElement, IStandaloneCodeEditor] {

  async function ev() {
    output.innerHTML = ''
    try {
      output.appendChild(t(print(evaluate(read(editor.getValue()))))) }
    catch (e: any) {
      output.appendChild(t(e.toString())) } }

  const entry = create_element('div', function () {
    this.style.height = "70%"
    this.style.flexShrink = "0" }, [])

  const editor = monaco.editor.create(entry, church_editor_config)
  editor.setValue(initial)

  const eval_button = button("Evaluate", "(F4) Evaluate the program and show the result.", ev)

  const menu = create_element('div', function () {
    this.style.flexShrink = "0"
    this.style.display = "flex"
    this.style.overflow = "hidden"
    this.style.flexDirection = "row"
    this.style.borderTopStyle = "solid"
    this.style.borderTopColor = playground_colors.contrast
    this.style.borderTopWidth = "1px"  }, [
    eval_button])

  const output = create_element("div", function () {
    this.tabIndex = 0
    this.style.whiteSpace = "pre-wrap"
    this.style.overflowWrap = "break-word"
    this.style.overflowX = "hidden"
    this.style.overflowY = "scroll"
    this.style.wordBreak = "break-all"
    this.style.flexShrink = "1"
    this.style.flexGrow = "1" }, [])

  const formatting = create_element("div", function () {
    this.tabIndex = 0
    this.style.display = "flex"
    this.style.flexDirection = "row"
    this.style.overflowX = "hidden"
    this.style.overflowY = "hidden"
    this.style.flexShrink = "1"
    this.style.flexGrow = "1"
    this.style.borderTopStyle = "solid"
    this.style.borderTopColor = playground_colors.contrast
    this.style.borderTopWidth = "1px" },
    [output])

  const playground = create_element('div', function() {
    this.style.textAlign = "left"
    this.style.display = "inline-flex"
    this.style.flexDirection = "column" }, [
    entry, menu, formatting])

  playground.addEventListener('keydown', e =>
    e.key === "F4" ? (ev(), true) : true)

return [playground, editor] }
