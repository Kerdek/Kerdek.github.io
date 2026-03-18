import { colors } from '../common/colors.js'
import { css } from '../common/util/dom.js'
import { assign, mod } from '../common/util/di.js'
import { menu_bar } from '../common/panes/ui.js'
import { add_script_editor } from './script_editor.js'
import { add_file_list } from './file_list.js'
import { alert } from '../common/panes/prompts.js'

onbeforeunload = () => true

document.title = 'Semity Playground'

css(`@font-face {
font-family: CMU Typewriter Text;
src: url('../../font/cmuntt.ttf'); }`)

css(`.monaco-editor, .hover-row {
font-family: CMU Typewriter Text; }`)

css(`.monaco-editor-overlaymessage {
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

alert("Licence Notice", "Use of this system or its source code is unauthorized until the doctrine of intellectual property is abolished.")

