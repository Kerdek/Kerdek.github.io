import { RangeBSearch, highlight_html, read, to_digraph, to_outline } from "./lang.js"
import { Graph, make, reduce, unthunk } from "./graph.js"

(async () => {

document.title = 'mystery repl'

const include: (src: string) => Promise<Event> =
src => new Promise(cb => {
  const js = document.createElement('script')
  js.src = src
  js.type = 'text/javascript'
  js.addEventListener('load', cb)
  document.head.appendChild(js) })

await include("../viz.js")
await include("../lite.render.js")

const style_element = document.createElement('style')
const style_sheet = document.head.appendChild(style_element).sheet

const style_rule: (x: string) => void =
style_sheet ? x => style_sheet.insertRule(x, 0) : () => {}

style_rule(`::selection { background: #5c0a28; }`)
style_rule(`* { margin: 0px; padding: 0px; }`)
style_rule(`@font-face {
  font-family: CustomFont;
  src: url("../cmuntt.ttf"); }`)
style_rule(`body {
  display: flex;
  flex-flow: column;
  font-family: CustomFont;
  font-size: 11pt;
  line-height: 13pt; }`)
style_rule(`.ree::after {
  content: '\\200D'; }`)
style_rule(`@media (prefers-color-scheme: light) {
  :root {
    --foreground: black;
    --dim: gray;
    --background: white;
    --punct: #bb69d4;
    --parn0: #512881;
    --parn1: #6e1680;
    --parn2: #892365;
    --parn3: #a32e5b;
    --parn4: #a13648;
    --parn5: #a85334;
    --quant: #530ba5;
    --const: #228709;
    --key: #280a8c;
    --id: #cd3a05;
    --ws: #3e8888; } }`)
style_rule(`@media (prefers-color-scheme: dark) {
  :root {
    --foreground: white;
    --dim: gray;
    --background: black;
    --punct: #9a1d3e;
    --parn0: #512881;
    --parn1: #6e1680;
    --parn2: #892365;
    --parn3: #a32e5b;
    --parn4: #a13648;
    --parn5: #a85334;
    --quant: #bb4088;
    --const: #96f3b5;
    --key: #7e57ff;
    --id: #ffaa8c;
    --ws: #006969; } }`)
style_rule(`body {
  background: var(--background);
  color: var(--foreground);
  caret-color: var(--foreground); }`)
style_rule(`.hlpunct { color: var(--punct); }`)
style_rule(`.hlparn0 { color: var(--parn0); }`)
style_rule(`.hlparn1 { color: var(--parn1); }`)
style_rule(`.hlparn2 { color: var(--parn2); }`)
style_rule(`.hlparn3 { color: var(--parn3); }`)
style_rule(`.hlparn4 { color: var(--parn4); }`)
style_rule(`.hlparn5 { color: var(--parn5); }`)
style_rule(`.hlquant { color: var(--quant); }`)
style_rule(`.hlconst { color: var(--const); }`)
style_rule(`.hlkey { color: var(--key); }`)
style_rule(`.hlid { color: var(--id); }`)
style_rule(`.hlws { color: var(--ws); }`)
style_rule(`svg text {
  font-size: 13pt;
  text-anchor: middle; }`)
style_rule(`svg .edge path, svg .node ellipse, svg .node polygon {
  stroke: var(--foreground);
  fill: none; }`)
style_rule(`svg .node text, svg .edge polygon, svg .node.start polygon {
  stroke: none;
  fill: var(--foreground); }`)
style_rule(`svg .node.start text {
  stroke: none;
  fill: var(--background); }`)

const txt: (x: string) => Text = x => document.createTextNode(x)
const cooperate = () => new Promise(r => setTimeout(r, 0))

const intro = document.createElement('div')
document.body.appendChild(intro)
intro.className = "hlquant"
intro.style.flex = "0 1 auto"

const reset_link = document.createElement('a')
intro.appendChild(reset_link)
reset_link.href = '#'
reset_link.appendChild(txt('Reset'))

const make_checkbox = (id: string, text: string) => {
  const box = document.createElement('input')
  intro.appendChild(box)
  box.id = id
  const label = document.createElement('label')
  intro.appendChild(label)
  label.setAttribute('for', id)
  box.type = "checkbox";
  label.appendChild(txt(text))
  box.checked = true
  return box }

const
  text_output = make_checkbox('text_output', 'Text Output'),
  expand_thunks = make_checkbox('expand_thunks', 'Expand Thunks'),
  graph_output = make_checkbox('graph_output', 'Show Graphs'),
  keep_steps = make_checkbox('keep_steps', 'Keep Steps')

const output = document.createElement('div')
document.body.appendChild(output)
output.style.flex = "1 0 auto"
output.style.position = "relative"

const input = document.createElement('div')
document.body.appendChild(input)
input.style.flex = "0 0 auto"
input.style.position = "relative"

const system = document.createElement('div')
input.appendChild(system)
system.style.setProperty('-webkit-text-fill-color', "transparent")
system.style.whiteSpace = "pre-wrap"
system.style.wordBreak = "break-all"

const prompt = document.createElement('span')
system.appendChild(prompt)
prompt.className = "hlquant"

const cmd = document.createElement('span')
system.appendChild(cmd)
cmd.className = 'ree'
cmd.toggleAttribute('contenteditable')
cmd.spellcheck = false
cmd.style.outline = "none"
cmd.style.backgroundColor = "transparent"
cmd.style.font = "inherit"
cmd.style.border = "none"
cmd.style.color = "inherit"
cmd.style.whiteSpace = "pre-wrap"
cmd.style.wordBreak = "break-all"

const system_shadow = document.createElement('div')
input.appendChild(system_shadow)
system_shadow.style.position = "absolute"
system_shadow.style.inset = "0px"
system_shadow.style.pointerEvents = "none"
system_shadow.style.whiteSpace = "pre-wrap"
system_shadow.style.wordBreak = "break-all"

const prompt_shadow = document.createElement('span')
system_shadow.appendChild(prompt_shadow)
prompt_shadow.className = "hlquant"

const cmd_shadow = document.createElement('span')
system_shadow.appendChild(cmd_shadow)
cmd_shadow.className = 'ree'
cmd_shadow.style.backgroundColor = "transparent"
cmd_shadow.style.font = "inherit"
cmd_shadow.style.border = "none"
cmd_shadow.style.color = "inherit"
cmd_shadow.style.whiteSpace = "pre-wrap"
cmd_shadow.style.wordBreak = "break-all"

const history = (() => {
const history_text = localStorage.getItem('repl-history')
if (history_text != null) {
  const maybe_history = JSON.parse(history_text)
  if (Array.isArray(maybe_history) && (maybe_history as any[]).every(x => typeof x === 'string')) {
    return maybe_history } }
return [] })()
history.unshift('')
let history_cursor = 0

cmd.oninput = () => {
  update_highlight() }

cmd.onkeydown = e => {
  if (e.ctrlKey) {
    if (e.key === 'a') {
      e.preventDefault()
      const z = document.getSelection()
      if (!z) {
        return false }
      z.removeAllRanges()
      const r = document.createRange()
      r.setStart(cmd.childNodes[0] as ChildNode, 0)
      r.setEnd(cmd.childNodes[0] as ChildNode, cmd.textContent?.length || 0)
      z.addRange(r)
      return false
    }
    if (e.key === 'v' || e.key === 'c' || e.key === 'x') {
      return true } }
  if (
    e.key === 'F1' ||
    e.key === 'F2' ||
    e.key === 'F3' ||
    e.key === 'F4' ||
    e.key === 'F5' ||
    e.key === 'F6' ||
    e.key === 'F7' ||
    e.key === 'F8' ||
    e.key === 'F9' ||
    e.key === 'F10' ||
    e.key === 'F11' ||
    e.key === 'F12' ||
    e.key === 'Shift' ||
    e.key === 'Control' ||
    e.key === 'Tab' ||
    e.key === 'Alt' ||
    e.key === 'CapsLock' ||
    e.key === 'NumLock' ||
    e.key === 'ScrollLock' ||
    e.key === 'ContextMenu' ||
    e.key === 'Process' ||
    e.key === 'Unidentified' ||
    e.key === 'Insert' ||
    e.key === 'Escape' ||
    e.key === 'Meta' ||
    e.key === 'PageUp' ||
    e.key === 'PageDown') {
    return true }
  e.preventDefault()
  if (e.key === 'ArrowUp') {
    if (history_cursor != history.length - 1) {
      cmd.innerHTML = ''
      cmd.appendChild(txt(history[++history_cursor]))
      update_highlight() }
    return false }
  if (e.key === 'ArrowDown') {
    if (history_cursor != 0) {
      cmd.innerHTML = ''
      cmd.appendChild(txt(history[--history_cursor]))
      update_highlight() }
    return false }
  if (e.key === 'Enter') {
    if (e.ctrlKey) {
      reset()
      return false }
    if (!e.shiftKey) {
      dispatch()
      return false } }
  const z = document.getSelection()
  if (!z) {
    return false }
  const outside = !(z.anchorNode == cmd && z.focusNode == cmd) && !(z.anchorNode == cmd.childNodes[0] && z.focusNode == cmd.childNodes[0])
  const text = cmd.textContent || ''
  const focus = outside ? text.length : z.focusNode === cmd ? z.focusOffset === 0 ? 0 : text.length : z.focusOffset
  const anchor = outside ? text.length : z.anchorNode === cmd ? z.anchorOffset === 0 ? 0 : text.length : z.anchorOffset
  const begin = Math.min(anchor, focus)
  const end = Math.max(anchor, focus)
  const preceding_position: (c: number) => number = c => c === 0 ? 0 : c - 1
  const successive_position: (c: number) => number = c => c === text.length ? text.length : c + 1
  const preceding_boundary: (c: number) => number = c => {
    let [ra, _rb] = ranges(c)
    if (!ra) return 0
    let [raa, _rab, rak] = ra
    if (rak == 'ws') {
      [ra, _rb] = ranges(raa)
      if (ra) {
        [raa, _rab, rak] = ra } }
    if (c === 0) return 0
    c--
    for (; c !== raa && (!/\s/.test(text[c - 1] as string) || /\s/.test(text[c] as string)); c--);
    return c }
  const successive_boundary: (c: number) => number = c => {
    let [_ra, rb] = ranges(c)
    if (!rb) return text.length
    let [_rba, rbb, rbk] = rb
    if (rbk == 'ws') {
      [_ra, rb] = ranges(rbb)
      if (rb) {
        [_rba, rbb, rbk] = rb } }
    if (c === text.length) return text.length
c++
    for (; c !== rbb && (/\s/.test(text[c - 1] as string) || !/\s/.test(text[c] as string)); c++);
    return c }
  const insert: (i: string) => [string, number, number] =
    i => [text.substring(0, begin) + i + text.substring(end), begin + i.length, begin + i.length]
  const remove_before: (n: number) => [string, number, number] =
    n => {
      const ap = Math.max(begin - n, 0)
      return [text.substring(0, ap) + text.substring(end), ap, ap] }
  const remove_after: (n: number) => [string, number, number] =
    n => {
      const bp = Math.max(end + n, 0)
      return [text.substring(0, begin) + text.substring(bp), begin, begin] }
  const seek: (n: number) => [string, number, number] =
    n => [text, n, n]
  const extend: (n: number) => [string, number, number] =
    n => [text, anchor, n]
  const go = (e.shiftKey ? extend : seek)
  const [textp, anchorp, focusp] =
    e.key === '\\' ? (() => {
      const [rl, rr] = ranges(begin)
      const rlk = rl ? rl[2] : null
      const rrk = rr ? rr[2] : null
      return insert(rrk === 'sb' || rlk === 'sb' || rrk === 'ib' || rlk === 'ib' ? '\\' : 'λ') })() :
    e.key === "Enter" ? insert('\n') :
    e.key === "Backspace" ? begin === end ? remove_before(e.ctrlKey ? begin - preceding_boundary(begin) : 1) : insert('') :
    e.key === "Delete" ? begin === end ? remove_after(e.ctrlKey ? successive_boundary(end) - end : 1) : insert('') :
    e.key === "Home" ? go(0) :
    e.key === "End" ? go(text.length) :
    e.key === "ArrowLeft" ? go((e.ctrlKey ? preceding_boundary : preceding_position)(focus))  :
    e.key === "ArrowRight" ? go((e.ctrlKey ? successive_boundary : successive_position)(focus)) :
    insert(e.key)
  const cmd_txt = txt(textp)
  cmd.innerHTML = ''
  cmd.appendChild(cmd_txt)
  update_highlight()
  history[0] = cmd.textContent || ''
  z.removeAllRanges()
  const r = document.createRange()
  r.setStart(cmd_txt, anchorp)
  r.setEnd(cmd_txt, anchorp)
  z.addRange(r)
  z.extend(cmd_txt, focusp)
  return false }

cmd.oncopy = e => {
  e.preventDefault()
  var z = window.getSelection()
  if (z && e.clipboardData) {
    e.clipboardData.setData('text/plain', z.getRangeAt(0).toString()) }
  return false }

cmd.onpaste = e => {
  e.preventDefault()
  if (e.clipboardData) {
    const content = e.clipboardData.getData('Text')
    if (window.getSelection) {
      const z = window.getSelection();
      if (!z) {
        return }
      const y = z.getRangeAt(0);
      if (y.startContainer === cmd) {
        const system_text = txt(content)
        cmd.innerHTML = ''
        cmd.appendChild(system_text)
        z.removeAllRanges()
        const r = document.createRange()
        r.setStart(system_text, content.length)
        r.setEnd(system_text, content.length)
        z.addRange(r) }
      else if (y.startContainer === cmd.childNodes[0]) {
        const a = y.startOffset
        const b = y.endOffset
        const t = cmd.textContent || ''
        const system_text = txt(t.substring(0, a) + content + t.substring(b))
        cmd.innerHTML = ''
        cmd.appendChild(system_text)
        z.removeAllRanges()
        const r = document.createRange()
        r.setStart(system_text, a + content.length)
        r.setEnd(system_text, a + content.length)
        z.addRange(r) }
      else {
        const t = cmd.textContent || ''
        const system_text = txt(t + content)
        cmd.innerHTML = ''
        cmd.appendChild(system_text)
        z.removeAllRanges()
        const r = document.createRange()
        r.setStart(system_text, t.length + content.length)
        r.setEnd(system_text, t.length + content.length)
        z.addRange(r) } }
    update_highlight()
    history[0] = cmd.textContent || '' } }

let ranges: RangeBSearch
const update_highlight =
() => {
  const s = cmd.textContent || ''
  const [t, r] = highlight_html(s)
  ranges = r
  cmd_shadow.innerHTML = t }
update_highlight()

function roughSizeOfObject(object: { [i: string]: any }) {
  const token = new Set<{ [i: string]: any }>
  token.add(object)
  const stack: { [i: string]: any }[] = [object];
  let bytes = 0;
  for(;;) {
    const value = stack.pop()
    if (value === undefined) return bytes
    bytes += 16
    for (const prop of Object.getOwnPropertyNames(value)) {
      bytes += 16
      const c = value[prop]
      switch (typeof c) {
        case 'string':
          bytes += 16 + c.length
          break
        case 'object':
          if (!token.has(c)) {
            token.add(c)
            stack.push(c) }
        break } } } }

let step = 0
let state = make(null, 'fls') as Graph

const set_prompt: (s: string) => void = s => {
  prompt.innerText = prompt_shadow.innerText = s }

type DispatchCB = (e: Graph) => Graph

const dispatch_waiting: DispatchCB =
e => make(null, 'app', state, e)

const dispatch = async () => {
  const s = cmd.textContent || ''
  const e = read(s)
  if (!e) {
    const p = document.createElement("p")
    p.innerText = " # parse error #"
    output.appendChild(p)
    window.scrollTo(0, document.body.scrollHeight)
    return }
  history[0] = s
  localStorage.setItem('repl-history', JSON.stringify(history))
  history.unshift('')
  history_cursor = 0
  state = dispatch_cb(e)
  dispatch_cb = dispatch_waiting
  const input_segment = document.createElement('div')
  output.appendChild(input_segment)
  const cmd_echo = system_shadow.cloneNode(true) as HTMLDivElement
  input_segment.appendChild(cmd_echo)
  cmd_echo.style.position = 'static'
  cmd.textContent = ''
  set_prompt('$')
  update_highlight()
  const output_segment = document.createElement('div')
  output.appendChild(output_segment)
  for (;;) {
    if (!keep_steps.checked) output_segment.innerHTML = ''
    const output_element = document.createElement('div')
    output_segment.appendChild(output_element)
    output_element.style.marginRight = "20pt"
    output_element.style.display = graph_output.checked ? "inline-table" : "block"
    output_element.style.verticalAlign = "top"
    const text_caption = document.createElement('div')
    output_element.appendChild(text_caption)
    if (graph_output.checked) {
      text_caption.style.display = 'table-caption'
      text_caption.style.captionSide = 'top' }
    const text = document.createElement('div')
    text_caption.appendChild(text)
    text.style.display = 'flex'
    const no = document.createElement('div')
    text.appendChild(no)
    no.style.fontWeight = 'bold'
    no.style.marginRight = "10pt"
    no.appendChild(txt(`${step++}`))
    const expand = (expand_thunks.checked ? unthunk : (x: Graph) => x)(state)
    if (text_output.checked) {
      const [head, ...rest] = to_outline(expand)
      const expr = document.createElement('div')
      text.appendChild(expr)
      const expr_line = document.createElement('div')
      expr.appendChild(expr_line)
      expr_line.style.whiteSpace = "pre-wrap"
      expr_line.style.paddingBottom = "8pt"
      expr_line.appendChild(txt(head))
      for (let i = 0; i < rest.length; i++) {
        const expr_line = document.createElement('div')
        expr.appendChild(expr_line)
        expr_line.style.display = 'flex'
        const no = document.createElement('div')
        expr_line.appendChild(no)
        no.style.captionSide = 'top'
        no.style.fontWeight = 'bold'
        no.style.marginRight = "10pt"
        no.appendChild(txt(`${i}`))
        const tx = document.createElement('div')
        tx.style.whiteSpace = "pre-wrap"
        expr_line.appendChild(tx)
        tx.appendChild(txt(rest[i] || ''))
      } }
    if (graph_output.checked) {
      output_element.appendChild(await to_digraph("state", { '': expand })) }
    const size_caption = document.createElement('div')
    output_element.appendChild(size_caption)
    size_caption.appendChild(txt(`${roughSizeOfObject(expand)} bytes`))
    window.scrollTo(0, document.body.scrollHeight)
    await cooperate()
    const next = reduce(state)
    if (!next) {
      return }
    else state = next } }

set_prompt('#')
let dispatch_cb: DispatchCB = e => e

const reset = () => {
output.innerHTML = ''
step = 0
state = make(null, 'fls')
dispatch_cb = e => e
set_prompt('#') }
reset_link.addEventListener('click', reset)

input.addEventListener('click', e => {
cmd.focus()
if (e.target === cmd) return true
return cmd.onclick && cmd.onclick(e) })

window.addEventListener('keydown', e => {
if (e.target === cmd) return true
return cmd.onkeydown && cmd.onkeydown(e) })

window.addEventListener('paste', e => {
if (e.target === cmd) return true
return cmd.onpaste && cmd.onpaste(e as ClipboardEvent) })

})()