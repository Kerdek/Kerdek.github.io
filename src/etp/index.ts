import { colors } from '../common/colors.js'
import { css } from '../common/util/dom.js'
import { assign, mod } from '../common/util/di.js'
import { menu_bar } from '../common/panes/ui.js'
import { add_script_editor } from './script_editor.js'
import { add_file_list } from './file_list.js'

onbeforeunload = () => true

document.title = 'Semity Playground'

css(`@font-face {
font-family: CMU Typewriter Text;
src: url('../../font/cmuntt.ttf'); }`)

css(`.monaco-editor, .hover-row {
font-family: CMU Typewriter Text; }`)

assign(document.documentElement.style, {
width: '100%',
height: '100%',
overflow: 'hidden',
touchAction: 'none' })

assign(document.body.style, {
position: 'relative',
height: '100%',
margin: '0',
fontFamily: 'CMU Typewriter Text',
fontSize: '13px',
overflow: 'hidden',
background: colors.background,
color: colors.foreground,
caretColor: colors.foreground })

document.body.addEventListener('contextmenu', ev => {
  ev.preventDefault()
  return false })

document.body.append(mod(menu_bar([
{ label: 'Window', tip: 'Show tool windows', items: [
  { type: 'text', label: 'Script Editor', tip: 'Open script editor', handler: add_script_editor },
  { type: 'text', label: 'File List', tip: 'Open file list', handler: add_file_list }] }]), e => {
  assign(e.style, {
    zIndex: '99999' }) }))

//     import { print_messages } from "./print.js"
// import { hover_accent, download, elm, prompt_file, css, txt } from "../common/util/dom.js"
// import { colors } from "../common/colors.js"
// import { create_editor } from "./editor.js"
// import { mod, moda } from "../common/util/di.js"
// import { get_model_data } from "./language_server.js"

// const { assign } = Object
// const { documentElement: html, body } = document

// type Chapter = {
//   title: string,
//   text: string }

// document.title = 'Semity Proof Assistant'

// css(`@font-face {
//   font-family: CMU Typewriter Text;
//   src: url("../common/cmuntt.ttf"); }`)

// const
//   yes_no = (message: string) => new Promise<boolean>(resolve => {
//     app.toggleAttribute('disabled')
//     body.append(mod(elm('div'), blanket => {
//       assign(blanket.style, {
//         ...fill,
//         zIndex: "1",
//         alignContent: "center",
//         textAlign: "center" })
//       blanket.append(
//         mod(elm('div'), e => {
//           assign(e.style, {
//             ...border,
//             padding: "8pt",
//             display: 'inline-block',
//             background: colors.background })
//           e.append(
//             mod(elm('div'), e => {
//               assign(e.style, {
//                 margin: "8pt" })
//               e.append(
//                 txt(message)) }),
//             mod(elm('div'), () => {
//               const button = (msg: string, f: () => void) =>
//                 mod(elm('div'), e => {
//                   assign(e.style, {
//                     ...border,
//                     userSelect: 'none',
//                     cursor: 'pointer',
//                     display: 'inline-block',
//                     margin: "8pt",
//                     paddingLeft: "8pt",
//                     paddingRight: "8pt" })
//                   hover_accent(e, {
//                     background: colors.background }, {
//                     background: colors.ruler })
//                   e.addEventListener('click', () => {
//                     f()
//                     app.toggleAttribute('disabled')
//                     body.removeChild(blanket) })
//                   e.append(txt(msg)) })
//               e.append(
//                 button('Yes', () => resolve(true)),
//                 button('No', () => resolve(false))) })) })) })) }),

//   border = {
//     borderStyle: "solid",
//     borderColor: colors.foreground,
//     borderWidth: "1px" },

//   left_border = {
//     borderLeftStyle: "solid",
//     borderLeftColor: colors.foreground,
//     borderLeftWidth: "1px" },

//   top_border = {
//     borderTopStyle: "solid",
//     borderTopColor: colors.foreground,
//     borderTopWidth: "1px" },

//   fill = {
//     position: "absolute",
//     inset: "0" },

//   editor_container = mod(elm('div'), e => {
//     assign(e.style, {
//       ...fill }) }),

//   output_pane = mod(elm("div"), e => {
//     assign(e.style, {
//       ...fill,
//       whiteSpace: "pre-wrap",
//       overflowY: "auto" }) }),

//   left_pane = await moda(elm("div"), async e => {
//     const
//       activate = async (chapter: Chapter) => {
//         active_chapter = chapter
//         const m = models.get(chapter)
//         if (m) {
//           editor.setModel(m) }
//         await check() },

//       refresh = async () => {
//         chapters.sort((a, b) =>
//           a.title.localeCompare(b.title))
//         table.innerHTML = ''
//         table.append(...await Promise.all(chapters.map(async chapter =>
//           mod(elm("div"), e => {
//             assign(e.style, {
//               display: "flex",
//               flexDirection: "row" })
//             if (chapter == active_chapter) {
//               assign(e.style, {
//                 background: colors.foreground,
//                 color: colors.background }) }
//             else {
//               hover_accent(e, {
//                 background: colors.background }, {
//                 background: colors.ruler }) }
//           e.append(
//             mod(elm('div'), e => {
//               assign(e.style, {
//                 flexGrow: "1" })
//               e.title = `Open chapter "${chapter.title}"`
//               if (chapter !== active_chapter) {
//                 assign(e.style, {
//                   cursor: "pointer" })
//                 e.addEventListener("click", async () => {
//                   await activate(chapter) }) }
//               e.append(
//                 txt(chapter.title)) }),
//             mod(elm('div'), e => {
//               assign(e, {
//                 title: `Delete chapter "${chapter.title}"` })
//               assign(e.style, {
//                 cursor: "pointer" })
//               e.addEventListener("click", async () => {
//                 if (await yes_no(`Delete chapter "${chapter.title}"?`)) {
//                   const m = models.get(chapter)
//                   if (m) {
//                     m.dispose() }
//                   models.delete(chapter)
//                   chapters.splice(chapters.indexOf(chapter), 1)
//                   await check() } })
//               e.append(
//                 txt("🗑️")) })) })))) },

//       check = async () => {
//         if (!active_chapter) {
//           return }
//         const s = editor.getValue()
//         const n = s.indexOf("\n")
//         assign(active_chapter, {
//           title: s.substring(0, n === -1 ? s.length : n),
//           text: s })
//         await refresh()
//         const c = models.get(active_chapter)
//         if (!c) {
//           return }
//         const m = get_model_data(c).messages
//         output_pane.innerHTML = ''
//         output_pane.append(...m.length === 0 ? [
//           mod(elm('div'), e => {
//             assign(e, {
//               title: 'No messages.' })
//             assign(e.style, {
//               fontSize: '40pt',
//               padding: '6pt' })
//             e.append(
//               txt("👍")) })] :
//           print_messages(m, w => {
//             if ('begin' in w) {
//               const p = {
//                 startLineNumber: w.begin.line,
//                 startColumn: w.begin.col,
//                 endLineNumber: w.end.line,
//                 endColumn: w.end.col }
//               editor.revealRange(p)
//               editor.setSelection(p) }
//             else {
//               const p = {
//                 lineNumber: w.line,
//                 column: w.col }
//               editor.revealPosition(p)
//               editor.setPosition(p) }
//             editor.focus() })) },

//       save = () => {
//         localStorage.setItem(
//           'semity-storage',
//           JSON.stringify(chapters)) },

//       empty_chapter = () => ({
//         title: "",
//         text: "" }),

//       fresh_model = (chapter: Chapter) => {
//         const m = monaco.editor.createModel(chapter.text, 'semity')
//         m.onDidChangeContent(() => {
//           check()
//           save() })
//         models.set(chapter, m)
//         return m },

//       fresh_models = async () => {
//         models.clear()
//         chapters.forEach(fresh_model)
//         if (chapters[0]) {
//           await activate(chapters[0]) } },

//       reset = async (src: string) => {
//         chapters.splice(0, chapters.length, ...JSON.parse(src))
//         await fresh_models() },

//       editor = create_editor(editor_container),
//       models = new Map<Chapter, monaco.editor.ITextModel>(),

//       table = mod(elm("div"), e => {
//         assign(e.style, {
//           ...fill,
//           overflowY: "auto" }) }),

//       chapters: Chapter[] = []

//     let active_chapter: Chapter | undefined

//     await reset(
//       localStorage.getItem('semity-storage') ||
//       await (await fetch("./preset.json")).text())

//     assign(e.style, {
//       ...left_border,
//       userSelect: "none",
//       flexShrink: "0",
//       display: "flex",
//       flexDirection: "column",
//       width: "190pt" })
//     e.append(
//       mod(elm("div"), e => {
//         assign(e.style, {
//           flexShrink: "0",
//           display: "flex",
//           flexDirection: "row" })
//         let b = {}
//         const button = (msg: string, title: string, f: () => void) => mod(elm('div'), e => {
//           assign(e.style, {
//             ...b,
//             textAlign: "center",
//             cursor: "pointer",
//             flexGrow: "1" })
//           e.title = title
//           b = left_border
//           hover_accent(e, {
//             background: colors.ruler }, {
//             background: colors.background })
//           e.addEventListener('click', f)
//           e.append(
//             txt(msg)) })
//         e.append(
//           button('Add', 'Add a chapter.', async () => {
//             const chapter = empty_chapter()
//             chapters.push(chapter)
//             fresh_model(chapter)
//             await activate(chapter) }),
//           button('Import', 'Delete everything and load from a file.', async () => {
//             const src = await prompt_file()
//             if (src) {
//               await reset(src)
//               save() } }),
//           button('Reset', 'Reset everything to the preset.', async () => {
//             if (await yes_no("Reset everything to the preset?")) {
//               await reset(await (await fetch("./preset.json")).text()) } }),
//           button('Export', 'Save everything to a file.', () => {
//             download(JSON.stringify(chapters), 'semity_export.json') })) }),
//     mod(elm('div'), e => {
//       assign(e.style, {
//         ...top_border,
//         position: "relative",
//         flexGrow: "1" })
//       e.append(table) })) }),

//   app = mod(elm('div'), e => {
//     assign(e.style, {
//       ...fill,
//       display: "flex",
//       flexDirection: "row" })
//     e.append(
//       mod(elm('div'), e => {
//         const indicator = txt('<')
//         assign(e.style, {
//           userSelect: "none",
//           flexShrink: "0",
//           alignContent: "center",
//           width: "8pt" })
//         e.title = "Show/Hide Table of Contents"
//         hover_accent(e, {
//           background: colors.background }, {
//           background: colors.ruler })
//         const
//           open = () => {
//             left_pane.style.display = 'flex'
//             indicator.textContent = '<'
//             e.removeEventListener('click', open)
//             e.addEventListener('click', close) },
//           close = () => {
//             left_pane.style.display = 'none'
//             indicator.textContent = '>'
//             e.removeEventListener('click', close)
//             e.addEventListener('click', open) }
//         e.addEventListener('click', close)
//         e.append(
//           indicator) }),
//       left_pane,
//       mod(elm('div'), e => {
//         assign(e.style, {
//           ...left_border,
//           flexGrow: "1",
//           display: 'flex',
//           flexDirection: 'column' })
//         e.append(
//           mod(elm('div'), e => {
//             assign(e.style, {
//               flexShrink: "0",
//               height: "70%",
//               position: "relative" }),
//             e.append(
//               editor_container) }),
//           mod(elm('div'), e => {
//             assign(e.style, {
//               ...top_border,
//               flexGrow: "1",
//               position: "relative" }),
//             e.append(
//               output_pane) })) })) })

// assign(body.style, {
//   ...fill,
//   margin: "0" })

// body.append(app)

// assign(html.style, {
//   position: "absolute",
//   inset: "0",
//   overflow: "hidden",
//   fontFamily: "CMU Typewriter Text",
//   fontSize: "12pt",
//   background: colors.background,
//   color: colors.foreground,
//   caretColor: colors.foreground })