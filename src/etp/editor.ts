import { colors, mode } from '../common/colors.js'
import { token_kinds } from './tokenizer.js'
import { editor } from './monaco.js'

editor.defineTheme('semity', {
  base: mode === 'dark' ? 'hc-black' : 'vs',
  inherit: true,
  rules: token_kinds.map(token => ({ token, foreground: colors[token] })),
  colors: {
    'editor.lineHighlightBackground': colors.lineHighlight,
    'editorRuler.foreground': colors.ruler,
    'editorIndentGuide.background1': colors.guide,
    'editorIndentGuide.background2': colors.guide,
    'editorIndentGuide.background3': colors.guide,
    'editorIndentGuide.background4': colors.guide,
    'editorIndentGuide.background5': colors.guide,
    'editorIndentGuide.background6': colors.guide,
    'editorIndentGuide.activeBackground1': colors.foreground,
    'editorIndentGuide.activeBackground2': colors.foreground,
    'editorIndentGuide.activeBackground3': colors.foreground,
    'editorIndentGuide.activeBackground4': colors.foreground,
    'editorIndentGuide.activeBackground5': colors.foreground,
    'editorIndentGuide.activeBackground6': colors.foreground, } })

editor.setTheme('semity')

const config: monaco.editor.IStandaloneEditorConstructionOptions = {
language: 'semity',
fontSize: 13,
fontFamily: 'CMU Typewriter Text',
tabSize: 2,
rulers: [20, 40],
matchBrackets: 'always',
pasteAs: {
  enabled: false },
suggest: {
  insertMode: 'replace' },
inlineSuggest: { enabled: false },
quickSuggestions: false,
minimap: {
  enabled: false },
insertSpaces: true,
automaticLayout: true,
fixedOverflowWidgets: true,
hover: {
  enabled: true,
  delay: 300 },
'semanticHighlighting.enabled': true }

export const create_editor = (e: HTMLElement) =>
editor.create(e, config)
