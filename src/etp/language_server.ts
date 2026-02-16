// import { lookup } from '../common/util/di.js'
import { Statement, abstract_article } from './abstract.js'
import { article_tokens } from './article_tokens.js'
import { Transcript, check_article, scan_article } from './check.js'
import { ConcreteStatement } from './concrete.js'
import { Messages, Module } from './context.js'
import { add_files_changed_listener, files } from './fs.js'
import { article_messages } from './messages.js'
import { languages } from './monaco.js'
// import { position_from_monaco, range_to_monaco } from './monaco_range.js'
import { print_message_contents, text_format } from './print.js'
import { read_article } from './read.js'
// import { empty_range } from './scanner.js'
// import { select_statement } from './select.js'
import { token_kinds, tokenizer } from './tokenizer.js'

const read = (text: string): ConcreteStatement =>
read_article(tokenizer(text, { line: 1, col: 1 }))

type TextModelDataCache = {
source: string
version: number
concrete: ConcreteStatement
abstract: Statement | null
transcript: Transcript
messages: Messages }

type TextModelData = {
add_change_listener: (handler: () => void) => void
remove_change_listener: (handler: () => void) => void
model: monaco.editor.ITextModel
cache: (b?: boolean) => TextModelDataCache }

type FileData = {
context: Module
dependencies: Set<string> }

const text_model_data_map = new Map<string, TextModelData>()

const file_data_map = new Map<string, FileData>()

const fresh_file_data = (
  dependents: string[],
  source: string): FileData => {
const
  concrete = read(source),
  abstract = abstract_article(concrete),
  dependencies = new Set<string>(),
  context = scan_article(abstract, name => {
    if (dependents.includes(name)) {
      return null }
    const data = get_file_data(dependents, name)
    if (!data) {
      return null }
    dependencies.add(name)
    data.dependencies.forEach(d => dependencies.add(d))
    return data.context })
return { context, dependencies } }

const get_file_data = (
  dependents: string[],
  name: string): FileData | null => {
let data = file_data_map.get(name)
if (data) {
  return data }
const f = files[name]
if (!f) {
  return null }
data = fresh_file_data([...dependents, name], f.contents)
file_data_map.set(name, data)
const dep = data.dependencies
if (dependents.some(x => dep.has(x))) {
  return null }
return data }

const fresh_text_model_data_cache = (
  model: monaco.editor.ITextModel): TextModelDataCache => {
const
  version = model.getVersionId(),
  source = model.getValue(),
  concrete = read(source),
  abstract = abstract_article(concrete),
  sm = article_messages(concrete),
  dependencies = new Set<string>(),
  [transcript, cm] = check_article(abstract, name => {
    const data = get_file_data([], name)
    if (!data) {
      return null }
    dependencies.add(name)
    data.dependencies.forEach(d => dependencies.add(d))
    return data.context }),
  messages = [...sm || [], ...cm]
monaco.editor.setModelMarkers(model, 'syntax', messages.map(m => ({
  startLineNumber: 'begin' in m.w ? m.w.begin.line : m.w.line,
  startColumn: 'begin' in m.w ? m.w.begin.col : m.w.col,
  endLineNumber: 'end' in m.w ? m.w.end.line : m.w.line,
  endColumn: 'end' in m.w ? m.w.end.col : m.w.col,
  message: /* m.title + ': ' +  */m.c.map(c => print_message_contents(text_format)(c)).join('\n'),
  severity: monaco.MarkerSeverity.Error })))
return { version, source, concrete, abstract, transcript, messages } }

export const get_model_data = (
  model: monaco.editor.ITextModel): TextModelData => {
let data = text_model_data_map.get(model.id)
if (data) {
  return data }
let dispose = () => {
  dispose = () => {}
  text_model_data_map.delete(model.id) }
model.onDidChangeLanguage(({ newLanguage }) => {
  if (newLanguage !== 'semity') {
    dispose() } })
model.onWillDispose(() => {
  dispose() })
data = {
  model,
  add_change_listener: h => {
    change_listeners.add(h) },
  remove_change_listener: h => {
    change_listeners.delete(h) },
  cache: b => {
    if (!b && cache.version === model.getVersionId()) {
      return cache }
    cache = fresh_text_model_data_cache(model)
    change_listeners.forEach(h => h())
    return cache } }
const change_listeners = new Set<() => void>()
let cache = fresh_text_model_data_cache(model)
text_model_data_map.set(model.id, data)
return data }

add_files_changed_listener(() => {
  file_data_map.clear()
  text_model_data_map.forEach(({ cache }) => {
    cache(true) }) })

languages.register({ id: 'semity' })

languages.setLanguageConfiguration('semity', {
  comments: {
    lineComment: '--',
    blockComment: ['(*', '*)'] },
  brackets: [
    ['(', ')'],
    ['[', ']'] ],
  colorizedBracketPairs: [],
  autoClosingPairs: [
    { open: '(', close: ')' },
    { open: '[', close: ']' },
    { open: '(*', close: '*)' } ],
  surroundingPairs: [
    { open: '(', close: ')' },
    { open: '[', close: ']' },
    { open: '(*', close: '*)' } ],
  folding: { 'markers':
    { start: /\(/, end: /\)/ } } })

languages.registerDocumentSemanticTokensProvider('semity', {
getLegend: () => (
  { tokenTypes: [...token_kinds], tokenModifiers: [] }),
provideDocumentSemanticTokens: (model, _resultId, _token) => ({
  data: new Uint32Array((article_tokens(get_model_data(model).cache().concrete) || []).reduce<[number[], number, number]>(
    ([a, l, c], b) => (a.push(b.w.begin.line - l, b.w.begin.line === l ? b.w.begin.col - c : b.w.begin.col - 1, b.w.end.col - b.w.begin.col, token_kinds.indexOf(b.type), 0), [a, b.w.begin.line, b.w.begin.col]), [[], 1, 1])[0]) }),
releaseDocumentSemanticTokens(_resultId) { } })

// languages.registerHoverProvider('church', {
// provideHover: (model, position) => {
// const
//   e = get_model_data(model).cache(),
//   wp = position_from_monaco(position),
//   selection = e.abstract && select_statement(wp)(e.abstract)
// return selection && {
//   range: range_to_monaco(
//     selection.k === 'statement' ? selection.n.w :
//     selection.k === 'proof' ? selection.e.w :
//     selection.k === 'proposition' ? selection.t.w :
//     selection.k === 'binding' ? selection.w :
//     empty_range(wp)),
//   contents: (() =>
//     tr(lookup(e.transcript, selection.e), g =>
//       selection.k === 'term' ?
//         assignable(g.found, g.expected, g) && assignable(g.expected, g.found, g) ?
//           [`(term) ${print_type(highlight_text_format)(g.expected).join('')}`] :
//         [`(term) ${print_type(highlight_text_format)(g.found).join('')}`,
//         `(expected) ${print_type(highlight_text_format)(g.expected).join('')}`] :
//       selection.k === 'type' ? [
//         `(type) ${print_type(highlight_text_format)(aka(selection.t, g.bindings)).join('')}`] :
//       selection.k === 'binding' ?
//         tr(look_up_term(selection.i, g.judgments), j => [
//         `(binding) ${print_type(highlight_text_format)(j.t).join('')}`]) || [] :
//       []) || [])().map(value => ({ supportHtml: true, value })) } } })
