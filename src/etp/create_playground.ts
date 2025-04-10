import { scanner, read_article } from './read.js'
import { compare, evaluate, is_closed } from './evaluate.js'
import { print_goals, print_prop } from './print.js'
import { Scope } from './lang.js'

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

const church_monarch_tokens: monaco.languages.IMonarchLanguage = {
  brackets: [
    { open: "(", close: ")", token: "brackets"} ],
  unicode: true,
  includeLF: true,
  defaultToken: "invalid",
  ignoreCase: false,
  operators: [],
  symbols: /\\|∀|->|→|\*|\./,
  tokenizer: {
    root: [
      [/\(\*/,  { token: "comment", next: "@block_comment" }],
      [/--/, { token: "comment", next: "@line_comment" }],
      [/[()]/, 'brackets'],
      [/\\|\/|∀|∃|->|→|\.|(\b(theorem|axiom|schema|declare|proof|apply|push|with|intro|use|sorry|qed)\b)/, 'lambda'],
      [/[^\s\\\/∀∃\.\(\)\->]+/, 'reference']],
    block_comment: [
      [/([^\*]|\*[^\)])+/, "comment"],
      [/\*\)/, { token: "comment", next: "@pop" }]],
    line_comment: [
      [/[^\n]+/, "comment"],
      [/\n/, { token: "comment", next: "@pop" }]] } }

const church_language_config: monaco.languages.LanguageConfiguration = {
  comments: {
    lineComment: "--",
    blockComment: ["(*", "*)"] },
  brackets: [
    ["(", ")"] ],
  autoClosingPairs: [
    { open: "(", close: ")" },
    { open: "(*", close: "*)" } ],
  surroundingPairs: [
    { open: "(", close: ")" },
    { open: "(*", close: "*)" } ],
  folding: { "markers":
    { start: /\(/, end: /\)/ } } }

const church_editor_config: monaco.editor.IStandaloneEditorConstructionOptions = {
  bracketPairColorization: {
    enabled: true },
  matchBrackets: "always",
  fontSize: 18,
  rulers: [40, 60],
  language: 'church',
  inlineSuggest: {enabled: false},
  quickSuggestions: false,
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
  'lambda': '#CC3366',
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

const church_theme: monaco.editor.IStandaloneThemeData = {
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
    "editorBracketHighlight.foreground1": "#512881",
    "editorBracketHighlight.foreground2": "#6e1680",
    "editorBracketHighlight.foreground3": "#892365",
    "editorBracketHighlight.foreground4": "#a32e5b",
    "editorBracketHighlight.foreground5": "#a13648",
    "editorBracketHighlight.foreground6": "#a85334",
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

type MFile = {
  title: string,
  text: string,
  exports: Scope }

const preset = await (await fetch("./preset.json")).text()

export function create_playground(): [HTMLElement, monaco.editor.IStandaloneCodeEditor] {

  let mfiles: MFile[]

  const pg = localStorage.getItem('proof-playground')
  if (pg) {
    try {
      mfiles = JSON.parse(pg) as MFile[] }
    catch (e) {
      mfiles = JSON.parse(preset) as MFile[] } }
  else {
    mfiles = JSON.parse(preset) as MFile[] }

  let active_file: MFile

  if (!mfiles[0]) {
    mfiles.push({
      title: "",
      text: "",
      exports: { props: [], proofs: [] } }) }

  active_file = mfiles[0] as MFile

  let kg = false
  let ig = false

  function uf() {
    mfiles.sort((a, b) => a.title > b.title ? 1 : a.title < b.title ? -1 : 0)
    localStorage.setItem('proof-playground', JSON.stringify(mfiles))
    file_list.innerHTML = ''
    for (const mfile of mfiles) {
      const d = create_element("span", function() {}, [t("🗑️")])
      const e = create_element("div", function () {}, [d, t(mfile.title)])
      file_list.appendChild(e)
      d.addEventListener("click", () => {
        mfiles.splice(mfiles.indexOf(mfile), 1)
        ev() })
      e.addEventListener("click", () => {
        active_file = mfile
        editor.setValue(mfile.text) }) } }

  function ev() {
    async function evl() {
      while (kg) {
        kg = false
        right_pane.style.pointerEvents = "none"
        const otext: string[] = []
        try {
          let ok = true
          let text = editor.getValue()
          let n = text.indexOf("\n")
          if (n === -1) {
            n = text.length }
          active_file.title = text.substring(0, n)
          active_file.text = text
          text = text.substring(n + 1)
          const [article, article_messages] = read_article(scanner(text, active_file.title))
          article_messages.length !== 0 && (ok = false, otext.push(`${article_messages.join('\n')}\n\n`))
          const prefix: Scope = { props: [], proofs: [] }
          const nm = mfiles.indexOf(active_file)
          for (let i = 0; i < nm; i++) {
            const mfile = mfiles[i] as MFile
            prefix.props.push(...mfile.exports.props)
            prefix.proofs.push(...mfile.exports.proofs) }
          active_file.exports = { props: [], proofs: [] }
          for (const statement of article) {
            switch (statement.kind) {
              case "declare": {
                for (const id of statement.ids) {
                  if (-1 !== prefix.props.indexOf(id)) {
                    otext.push(`(${statement.where}): ${id}\n\n`)
                    otext.push(`Proposition name already used.\n`)
                    ok = false }
                  prefix.props.unshift(id)
                  active_file.exports.props.push(id) }
                break }
              case "axiom": {
                const m: string[] = []
                if (!is_closed(statement.prop, [...statement.scheme, ...prefix.props])) {
                  m.push(`Axiom proposition is not closed.`)}
                if (-1 !== prefix.proofs.findIndex(([k, _v]) => compare(k, statement.name))) {
                  m.push(`Axiom name already used.`) }
                else {
                  prefix.proofs.unshift([statement.name, statement.scheme, statement.prop])
                  active_file.exports.proofs.push([statement.name, statement.scheme, statement.prop]) }
                if (m.length !== 0) {
                  otext.push(`(${statement.where}): ${print_prop(statement.name, false)}\n\n`)
                  m.length !== 0 && otext.push(`${m.join('\n')}\n`)
                  ok = false }
                break }
              case "theorem": {
                const m: string[] = []
                if (!is_closed(statement.prop, [...statement.scheme, ...prefix.props])) {
                  m.push(`Theorem proposition is not closed.`)}
                const [g, m2] = evaluate(statement.proof, statement.prop, { props: [...statement.scheme, ...prefix.props], proofs: [...prefix.proofs] })
                m.push(...m2)
                if (-1 !== prefix.proofs.findIndex(([k, _v]) => compare(k, statement.name))) {
                  m.push(`Theorem name already used.`) }
                else {
                  prefix.proofs.unshift([statement.name, statement.scheme, statement.prop])
                  active_file.exports.proofs.push([statement.name, statement.scheme, statement.prop]) }
                if (m.length !== 0 || g.length !== 0) {
                  otext.push(`(${statement.where}): ${print_prop(statement.name, false)}\n\n`)
                  m.length !== 0 && otext.push(`${m.join('\n')}\n`)
                  otext.push(`${print_goals(g)}\n\n`)
                  ok = false }
                break } }
            await new Promise(c => window.setTimeout(c, 0)) }
          ok && otext.push("👍") }
        catch (e: any) {
          otext.push(e.toString()) }
        uf()
        right_pane.style.removeProperty("pointer-events")
        output.innerHTML = ''
        output.appendChild(t(otext.join(''))) }
      ig = false }
    kg = true
    if (!ig) {
      ig = true
      evl() } }

  const input = create_element('div', function () {
    this.style.width = "70%"
    this.style.flexShrink = "0" }, [])

  const editor = monaco.editor.create(input, church_editor_config)
  editor.setValue(active_file.text)

  const output = create_element("div", function () {
    this.tabIndex = 0
    this.style.whiteSpace = "pre-wrap"
    this.style.overflowX = "hidden"
    this.style.overflowY = "scroll"
    this.style.flexGrow = "1"
    this.style.borderBottomStyle = "solid"
    this.style.borderBottomColor = playground_colors.contrast
    this.style.borderBottomWidth = "1px" }, [])

  const file_list = create_element("div", function () { }, [])

  const add_file = create_element("div", function () {
    this.style.borderRightStyle = "solid"
    this.style.borderRightColor = playground_colors.contrast
    this.style.borderRightWidth = "1px"
    this.style.flexGrow = "1" }, [
    t("Add File")])

  const import_all = create_element("div", function () {
    this.style.borderRightStyle = "solid"
    this.style.borderRightColor = playground_colors.contrast
    this.style.borderRightWidth = "1px"
    this.style.flexGrow = "1" }, [
    t("Import")])

  const export_all = create_element("div", function () {
    this.style.flexGrow = "1"}, [
    t("Export")])

  const files_tools = create_element("div", function () {
    this.style.display = "flex"
    this.style.flexDirection = "row"
    this.style.borderBottomStyle = "solid"
    this.style.borderBottomColor = playground_colors.contrast
    this.style.borderBottomWidth = "1px" }, [
    add_file, import_all, export_all])

  const files = create_element("div", function () {
    this.style.overflowX = "hidden"
    this.style.overflowY = "scroll"
    this.style.flexGrow = "1" }, [
    files_tools,
    file_list ])

  const right_pane = create_element("div", function () {
    this.style.display = "flex"
    this.style.flexDirection = "column"
    this.style.overflowX = "hidden"
    this.style.overflowY = "hidden"
    this.style.flexShrink = "1"
    this.style.flexGrow = "1"
    this.style.borderLeftStyle = "solid"
    this.style.borderLeftColor = playground_colors.contrast
    this.style.borderLeftWidth = "1px" }, [
    output,
    files])

  const playground = create_element('div', function() {
    this.style.textAlign = "left"
    this.style.display = "inline-flex"
    this.style.flexDirection = "row" }, [
    input,
    right_pane])

  import_all.addEventListener("click", () => {
    let input = document.createElement('input')
    input.type = 'file'
    input.onchange = async () => {
      let files = input.files
      if (!files || !files[0]) {
        return }
      const text = await files[0].text()
      mfiles = JSON.parse(text) }
    input.click() })

  export_all.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(mfiles)], { type: "text/plain" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = 'proof_playground_export.json'
    document.body.appendChild(a)
    a.click();
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  })

  add_file.addEventListener("click", () => {
    const mfile: MFile = {
      title: "",
      text: "",
      exports: { props: [], proofs: [] } }
    mfiles.push(mfile)
    uf()
    active_file = mfile
    editor.setValue(mfile.text) })

  const m = editor.getModel()
  m && m.onDidChangeContent(ev)
  ev()
  uf()

return [playground, editor] }
