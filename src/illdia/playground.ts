import { html_element, pointer_hold, text_node } from './dom.js'
import { create_editor } from './editor.js'

onbeforeunload = () => true

document.title = 'Illdia Playground'

const style_rule: (x: string) => number = (() => {
const style = document.head.appendChild(document.createElement('style'))
const ss = style.sheet
return ss ? x => ss.insertRule(x, 0) : () => -1 })()

style_rule(`@font-face {
font-family: CMU Typewriter Text;
src: url("../cmuntt.ttf"); }`)
style_rule(`html {
width: 100%;
height: 100%; }`)
style_rule(`body {
height: 100%;
margin: 0;
padding: 0;
font-size: 13px;
overflow: hidden;
background: black;
color: white;
caret-color: white; }`)

export const create_button = (text: string, mod: (this: HTMLDivElement) => void) => html_element('div', function () {
this.style.borderStyle = "solid"
this.style.borderWidth = "1px"
this.style.borderColor = "white"
this.style.userSelect = "none"
this.style.whiteSpace = "pre"
this.style.display = "flex"
this.style.justifyContent = "center"
this.style.alignItems = "center"
this.style.overflow = "hidden"
this.style.height = '18px'
this.style.paddingLeft = '8px'
this.style.paddingRight = '8px'
this.style.cursor = "pointer"
this.tabIndex = 0
const highlight = () => {
  this.style.background = 'white'
  this.style.color = 'black' }
const unhighlight = () => {
  this.style.background = 'black'
  this.style.color = 'white' }
unhighlight()
this.addEventListener('mouseenter', highlight)
this.addEventListener('mouseleave', unhighlight)
mod.apply(this) }, [text_node(text)])

export const create_textbox = (text: string, mod: (this: HTMLDivElement) => void): [Text, HTMLElement] => {
  const node = text_node(text)
  return [node, html_element('div', function () {
    this.toggleAttribute('contenteditable')
    this.style.whiteSpace = "pre"
    this.style.display = "inline-flex"
    this.style.justifyContent = "start"
    this.style.alignItems = "center"
    this.style.overflow = "scroll"
    this.style.borderStyle = "solid"
    this.style.borderWidth = "1px"
    this.style.borderColor = "white"
    this.style.height = '18px'
    this.style.paddingLeft = '8px'
    this.style.paddingRight = '8px'
    this.style.cursor = 'text'
    this.tabIndex = 0
    mod.apply(this) }, [
    node, html_element('br', function() {}, [])])] }

type ContextMenuItemText = {
  type: 'text',
  label: string,
  handler: () => void,
  items?: ContextMenuItem[] }

type ContextMenuItemSeparator = {
  type: 'separator' }

type ContextMenuItem =
  ContextMenuItemText |
  ContextMenuItemSeparator

let context_menu_element: HTMLElement | undefined

export const context_menu = (x: number, y: number, items: ContextMenuItem[]) => {
  if (context_menu_element) {
    document.body.removeChild(context_menu_element) }
  const elems: HTMLElement[] = []
  for (const item of items) {
    elems.push(
      item.type === 'separator' ?
        html_element('div', function () {
          this.style.height = '1px'
          this.style.background = 'white'
          this.style.marginLeft = '8px'
          this.style.marginRight = '8px' }, []) :
      item.type === 'text' ?
        html_element('div', function () {
          this.style.height = '100%'
          this.style.userSelect = "none"
          this.style.display = "flex"
          this.style.justifyContent = "start"
          this.style.alignItems = "center"
          this.style.height = '18px'
          this.style.margin = '1px'
          this.style.paddingLeft = '8px'
          this.style.paddingRight = '8px'
          this.style.cursor = "pointer"
          this.addEventListener('click', e => {
            if (e.button === 0) {
              item.handler() } })
          const highlight = () => {
            this.style.background = 'white'
            this.style.color = 'black' }
          const unhighlight = () => {
            this.style.background = 'black'
            this.style.color = 'white' }
          unhighlight()
          this.addEventListener('mouseenter', highlight)
          this.addEventListener('mouseleave', unhighlight) }, [
          text_node(item.label)]) :
      item) }
  context_menu_element = html_element('div', function () {
    this.style.zIndex = '100000'
    this.style.background = 'black'
    this.style.borderStyle = "solid"
    this.style.borderWidth = "1px"
    this.style.borderColor = "white"
    this.style.position = 'absolute'
    this.style.overflow = 'hidden' }, elems)
  document.body.appendChild(context_menu_element)
  context_menu_element.style.left = `${x + context_menu_element.offsetWidth > document.body.offsetWidth ? x - context_menu_element.offsetWidth : x}px`
  context_menu_element.style.top = `${y + context_menu_element.offsetHeight > document.body.offsetHeight ? y - context_menu_element.offsetHeight : y}px`
  const click = () => {
    if (context_menu_element) {
      document.body.removeChild(context_menu_element)
      context_menu_element = undefined }
    removeEventListener('click', click, true) }
  addEventListener('click', click, true) }

type PaneMeta = [HTMLElement, HTMLElement]

const panes: PaneMeta[] = []
const closers = new Set<() => void>()

const shift_down = (i: number) => {
for (const pane of panes) {
  const j = parseInt(pane[0].style.zIndex)
  if (j > i) {
    pane[0].style.zIndex = `${j - 1}` } } }

const to_front = (p: HTMLElement) => {
const i = parseInt(p.style.zIndex)
p.style.zIndex = `${panes.length}`
shift_down(i) }

const set_emph = () => {
for (const pane of panes) {
  const i = parseInt(pane[0].style.zIndex)
  if (i == panes.length - 1) {
    pane[1].style.background = 'white'
    pane[1].style.color = 'black' }
  else {
    pane[1].style.background = 'black'
    pane[1].style.color = 'white' } } }

const activate = (p: HTMLElement) => {
to_front(p)
set_emph() }

type Pane = {
  client_width(): number,
  client_height(): number,
  add_close_handler(handler: () => void): void
  remove_close_handler(handler: () => void): void
  set_title(title: string): void
  close(): void }

type PaneUser = {
  offset_width(): number,
  offset_height(): number,
  close(): void }

type CreatePaneOptions = {
  size?: [number, number],
  auto_size?: true | false,
  user_size?: true | false }

type CreatePane = (element: HTMLElement, options?: CreatePaneOptions) => [Pane, PaneUser]

let pane_spawn = 100

const create_pane: CreatePane = (element, options): [Pane, PaneUser] => {
  if (pane_spawn > document.body.clientHeight - 100) {
    pane_spawn -= document.body.clientHeight - 200 }
  let pos: [number, number] = [pane_spawn, pane_spawn]
  let size: [number, number] = options?.size || [700, 700]

  pane_spawn += 100

  const close_handlers = new Set<() => void>()

  const close = () => {
    for (const handler of close_handlers) {
      handler() }
    const k = panes.findIndex(x => x[0] == all)
    if (k !== -1) {
      panes.splice(k, 1) }
    closers.delete(close)
    document.body.removeChild(all)
    shift_down(parseInt(all.style.zIndex))
    set_emph() }

  const title_text = text_node('')
  const title_text_box = html_element('div', function() {
    this.style.whiteSpace = "pre"
    this.style.height = "100%"
    this.style.display = "flex"
    this.style.justifyContent = "center"
    this.style.alignItems = "center"
    this.style.flexGrow = "1"
    this.style.flexShrink = "1"
    this.style.flexBasis = "0"
    this.style.overflow = "hidden"

    this.addEventListener('pointerdown', async e => {
      if (e.button === 0) {
        const drag_start: [number, number] = [e.screenX, e.screenY]
        const pos_start: [number, number] = [...pos]
        pointer_hold(this, 0, e.pointerId, false, e => {
          pos[0] = pos_start[0] + e.screenX - drag_start[0]
          pos[0] = Math.min(pos[0], document.body.scrollWidth - 100)
          pos[0] = Math.max(pos[0], 100 - size[0])
          pos[1] = pos_start[1] + e.screenY - drag_start[1]
          pos[1] = Math.min(pos[1], document.body.scrollHeight - 100)
          pos[1] = Math.max(pos[1], 0)
          all.style.left = `${pos[0]}px`
          all.style.top = `${pos[1]}px` }) } })

      this.addEventListener('contextmenu', e => {
        e.stopPropagation()
        e.preventDefault()
        context_menu(e.clientX, e.clientY, [{
          type: 'text',
          label: 'Close',
          handler: () => {
            close() } }])
        return false }) }, [
    title_text])


  const resize_button = () => create_button("⤢", function () {
    this.style.margin = '1px'

    this.addEventListener('pointerdown', async e => {
      if (e.button === 0) {
        const drag_start: [number, number] = [e.screenX, e.screenY]
        const pos_start: [number, number] = [...pos]
        const size_start: [number, number] = [...size]
        pointer_hold(this, 0, e.pointerId, false, e => {
          if (drag_start) {
            size[0] = size_start[0] + e.screenX - drag_start[0]
            size[0] = Math.max(size[0], title_button_area.offsetWidth + 4)
            size[0] = Math.max(size[0], 100 - pos_start[0])
            size[1] = size_start[1] + drag_start[1] - e.screenY
            size[1] = Math.max(size[1], title_button_area.offsetHeight + 4)
            size[1] = Math.max(size[1], size_start[1] + 100 + pos_start[1] - document.body.scrollHeight)
            size[1] = Math.min(size[1], size_start[1] + pos_start[1])
            pos[1] = pos_start[1] + size_start[1] - size[1]
            all.style.top = `${pos[1]}px`
            all.style.width = `${size[0] - 2}px`
            all.style.height = `${size[1] - 2}px` } }) } }) })

  const close_button = create_button("✕", function () {
    this.style.margin = '1px'
    this.addEventListener("click", () => {
      close() }) })
  const title_button_area = html_element('div', function() {
    this.style.display = "flex"
    this.style.flexDirection = "row"
    this.style.flexBasis = "auto"
    this.style.flexGrow = "0"
    this.style.flexShrink = "0" }, [
    ...!options || !('user_size' in options) || options.user_size ? [resize_button()] : [],
    close_button])
  const titlebar = html_element('div', function() {
    this.style.borderBottomStyle = "solid"
    this.style.borderBottomWidth = "1px"
    this.style.borderBottomColor = "white"
    this.style.userSelect = "none"
    this.style.alignItems = "center"
    this.style.display = "flex"
    this.style.padding = '1px'
    this.style.flexDirection = "row"
    this.style.flexGrow = "0"
    this.style.flexShrink = "0"
    this.style.flexBasis = "auto"
    this.style.background = 'black'
    this.style.color = 'white' }, [
    title_text_box,
    title_button_area])
  const contents_box = html_element('div', function() {
    this.style.display = 'inline'
    this.style.flexGrow = "1"
    this.style.flexShrink = "0"
    this.style.flexBasis = "0"
    this.style.overflow = "hidden"  }, [
    element ])
  const all = html_element('div', function() {
    this.style.background = "black"
    this.style.borderStyle = "solid"
    this.style.borderWidth = "1px"
    this.style.borderColor = "white"
    this.style.display = "flex"
    this.style.flexDirection = "column"
    this.style.position = "absolute"
    this.style.left = `${pos[0]}px`
    this.style.top = `${pos[1]}px`
    this.style.width = `${size[0] - 2}px`
    this.style.height = `${size[1] - 2}px`
    this.style.overflow = "hidden"
    this.style.zIndex = `${panes.length}`

    this.addEventListener('mousedown', () => {
      activate(this) }) }, [
    titlebar,
    contents_box])
  panes.push([all, titlebar])
  closers.add(close)
  document.body.appendChild(all)
  if (options?.auto_size) {
    size = [element.offsetWidth + 2, element.offsetHeight + 26]
    all.style.width = `${size[0] - 2}px`
    all.style.height = `${size[1] - 2}px` }
  set_emph()
  return [{
    client_width() {
      return size[0] - 2 },
    client_height() {
      return size[1] - 26 },
    add_close_handler: handler => {
      close_handlers.add(handler) },
    remove_close_handler: handler => {
      close_handlers.delete(handler) },
    close,
    set_title: title => {
      title_text.data = title } },
  {
    offset_width() {
      return size[0] },
    offset_height() {
      return size[1] },
    close }] }

const prompt = async (title: string, suggest: string) => new Promise<string | undefined>(c => {
  let value: string | undefined = undefined
  const ok = () => {
    value = node.data
    pane.close() }
  const [node, box] = create_textbox(suggest, function() {
    this.style.margin = '4px'
    this.style.flexGrow = '1'
    this.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault()
        ok() } })})
  const [pane, _user] = create_pane(
    html_element('div', function() {
      this.style.padding = '20px'
      this.style.display = 'flex'
      this.style.flexDirection = 'row' }, [
      box,
      create_button('Ok', function() {
        this.style.margin = '4px'
        this.addEventListener('click', ok) })]), {
    user_size: false,
    auto_size: true })
  pane.set_title(title)
  pane.add_close_handler(() => {
    c(value) })
  box.focus() })

const alert = async (title: string, text: string) => new Promise<void>(c => {
  const box = html_element('div', function() {}, [text_node(text)])
  const [pane, _user] = create_pane(
    html_element('div', function() {
      this.style.whiteSpace = 'pre'
      this.style.padding = '4px'
      this.style.display = 'inline-flex'
      this.style.flexDirection = 'column' }, [
      box,
      html_element('div', function () {
        this.style.display = 'flex'
        this.style.flexDirection = 'row'
        this.style.justifyContent = 'center' }, [
        create_button('Ok', function() {
          this.style.margin = '4px'
          this.addEventListener('click', () => {
            pane.close() }) })])]), {
    user_size: false,
    auto_size: true })
  pane.set_title(title)
  pane.add_close_handler(() => {
    c() })
  box.focus() })

const yes_no = async (title: string, text: string) => new Promise<boolean>(c => {
  let value = false
  const box = html_element('div', function() {
    this.style.margin = '20px' }, [text_node(text)])
  const [pane, _user] = create_pane(
    html_element('div', function() {
      this.style.whiteSpace = 'pre'
      this.style.padding = '4px'
      this.style.display = 'inline-flex'
      this.style.flexDirection = 'column' }, [
      box,
      html_element('div', function () {
        this.style.display = 'flex'
        this.style.flexDirection = 'row'
        this.style.justifyContent = 'center' }, [
        create_button('Yes', function() {
          this.style.margin = '4px'
          this.addEventListener('click', () => {
            value = true
            pane.close() }) }),
        create_button('No', function() {
          this.style.margin = '4px'
          this.addEventListener('click', () => {
            pane.close() }) })])]), {
    user_size: false,
    auto_size: true })
  pane.set_title(title)
  pane.add_close_handler(() => {
    c(value) })
  box.focus() })

type MenuBarItem = {
  label: string,
  items: ContextMenuItem[] }

const menu_bar = (items: MenuBarItem[]) => {
const make_elem = (item: MenuBarItem) => create_button(item.label, function () {
  this.style.margin = '1px'
  this.style.borderTop = 'none'
  this.style.borderBottom = 'none'
  this.style.borderLeft = 'none'
  this.style.margin = '0px'
  this.style.display = 'inline-flex'
  this.addEventListener('click', () => {
    const bcr = this.getBoundingClientRect()
    context_menu(bcr.left, bcr.bottom, item.items) }) })
return html_element('div', function () {
  this.style.borderBottomWidth = '1px'
  this.style.borderBottomColor = 'white'
  this.style.borderBottomStyle = 'solid' }, items.map(make_elem)) }

document.body.appendChild(html_element('div', function () {
  this.style.width = '100%'
  this.style.height = '100%'
  this.addEventListener('contextmenu', e => {
    e.stopPropagation()
    e.preventDefault()
    context_menu(e.clientX, e.clientY, [{
      type: 'text',
      label: 'Add Script Editor',
      handler: add_script_editor },
    {
      type: 'text',
      label: 'Add File List',
      handler: add_file_list }])
    return false }) }, []))

const AsyncFunction = async function () {}.constructor

const run_script = (text: string, print: (s: string) => void): Promise<unknown> => {
const go = async (text: string) => {
  const include = async (name: string) => {
    const text = files[name]
    if (text === undefined) {
      throw new Error(`include: Specified file not found: ${name}`) }
      const blob = new Blob([`const print = window.print_proxy;const include = window.include_proxy;${text}`], { type: 'text/javascript' })
      const url = URL.createObjectURL(blob)
      ;(window as any)['print_proxy'] = print
      ;(window as any)['include_proxy'] = include
      const val = await import(url)
      URL.revokeObjectURL(url)
    return val }
  return await AsyncFunction("print", "include", text)(print, include) }
return go(text) }

const editor_config: monaco.editor.IStandaloneEditorConstructionOptions = {
  matchBrackets: "always",
  fontSize: 13,
  language: 'javascript',
  pasteAs: {
    enabled: false },
  // inlineSuggest: { enabled: false },
  quickSuggestions: false,
  minimap: {
    enabled: false },
  fontFamily: 'CMU Typewriter Text',
  tabSize: 2,
  insertSpaces: true,
  automaticLayout: true }

const valid_filename = (name: string) =>
  /^[^\0\/]+$/.test(name) && name !== '.' && name !== '..'

const prompt_filename = async (name: string) => {
const new_name = await prompt("Enter File Name", name)
if (new_name === undefined) {
  return undefined }
if (!valid_filename(new_name)) {
  await alert("Error", `Invalid file name entered: ${new_name}`)
  return undefined }
return name }

const files: { [i in string]: string } = (() => {
  const text = localStorage.getItem('illdia_files')
  return text ? JSON.parse(text) : {} })()

const files_changed_listeners: Set<() => void> = new Set()

const add_files_changed_listener = (handler: () => void): void => {
  files_changed_listeners.add(handler) }

const remove_files_changed_listener = (handler: () => void): void => {
  files_changed_listeners.delete(handler) }

const files_changed = (): void => {
  localStorage.setItem('illdia_files', JSON.stringify(files))
  for (const handler of files_changed_listeners) {
    handler() } }

const download_file = (name: string, text: string) => {
  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url) }

const add_file_list = (): PaneUser => {
  const menu = menu_bar([{
    label: 'File',
    items: [{
      type: 'text',
      label: 'New',
      handler: async () => {
        const name = await prompt_filename('')
        if (name) {
          if (name in files) {
            alert("Error", "Rename: File already exists.")
            return }
          files[name] = ''
          files_changed() } } },
    {
      type: 'separator' },
    {
      type: 'text',
      label: 'Import Files',
      handler: () => {
          let input = document.createElement('input')
          input.toggleAttribute('multiple')
          input.type = 'file'
          input.onchange = async () => {
            let inputs = input.files
            if (!inputs) {
              return }
            for (let i = 0; i < inputs.length; i++) {
              const input = inputs[i] as File
              if (!valid_filename(input.name)) {
                await alert("Error", `Import: Invalid file name: ${input.name}`)
                return } }
            for (let i = 0; i < inputs.length; i++) {
              const input = inputs[i] as File
              const text = await input.text()
              files[input.name] = text }
            files_changed() }
          input.click() } },
    {
      type: 'separator' },
    {
      type: 'text',
      label: 'Export All',
      handler: () => {
        for (const name in files) {
          const file = files[name]
          if (file) {
            download_file(name, file) } } } }] }])
  const update = () => {
    const item = (label: string) => create_button(label, function () {
      this.style.border = 'none'
      this.style.justifyContent = "start"
      this.addEventListener('click', () => {
        add_script_editor(files[label], label) })
      this.addEventListener('contextmenu', e => {
        e.stopPropagation()
        e.preventDefault()
        context_menu(e.clientX, e.clientY, [{
          type: 'text',
          label: 'Rename',
          handler: async () => {
            const name = await prompt_filename(label)
            if (name) {
              if (name in files) {
                alert("Error", "Rename: File already exists.")
                return }
              const file = files[label]
              if (file === undefined) {
                alert("Error", "Rename: File no longer exists.")
                return }
              else {
                files[name] = file
                delete files[label]
                files_changed() } } } },
        {
          type: 'text',
          label: 'Delete',
          handler: async () => {
            if (await yes_no('Confirm', `Delete File?\n\n${label}`)) {
              delete files[label]
              files_changed() } } }])
        return false }) })
    const list = html_element('div', function() {},
      Object.keys(files).sort().map(item))
    content.innerHTML = ''
    content.appendChild(list) }
  const content = html_element('div', function() {}, [])
  const all = html_element('div', function() {}, [menu, content])
  update()
  const [pane, user] = create_pane(all)
  pane.set_title('File List')
  add_files_changed_listener(update)
  pane.add_close_handler(() => {
    remove_files_changed_listener(update) })
  return user }

const add_script_editor = (text?: string | undefined, name?: string): PaneUser => {
  const input = html_element('div', function () {
    this.style.height = '70%' }, [])
  const editor = create_editor(input, editor_config)
  const model = editor.getModel()
  if (!model) {
    throw new Error("No text model in script editor.") }
  if (text) {
    model.setValue(text) }
  let current_filename: string | undefined = name
  const set_title = () => {
    pane.set_title(`Script Editor ${current_filename ? `(${current_filename})` : `[new file]`}`) }
  const save = () => {
    if (!current_filename) {
      save_as() }
    else {
      files[current_filename] = model.getValue()
      files_changed() } }
  const save_as = async () => {
    const name = await prompt_filename(current_filename || '')
    if (name) {
      current_filename = name
      set_title()
      save() } }
  const menu = menu_bar([{
    label: 'File',
    items: [{
      type: 'text',
      label: 'New',
      handler: () => {
        current_filename = undefined
        set_title()
        model.setValue('') } },
    {
      type: 'separator' },
    {
      type: 'text',
      label: 'Open...',
      handler: () => {
        input.style.display = 'none'
        output.style.display = 'none'
        const item = (label: string, handler: () => void) => create_button(label, function () {
          this.style.border = 'none'
          this.style.justifyContent = 'start'
          this.addEventListener('click', handler) })
        const put_back = () => {
          input.style.removeProperty('display')
          output.style.removeProperty('display')
          all.removeChild(list) }
        const list = html_element('div', function() {}, [
          item('..', put_back),
          ...Object.keys(files).sort().map(name => item(name, () => {
            model.setValue(files[name] || '')
            current_filename = name
            set_title()
            put_back() }))])
        all.appendChild(list) } },
    {
        type: 'separator' },
    {
      type: 'text',
      label: 'Save',
      handler: save },
    {
      type: 'text',
      label: 'Save As...',
      handler: save_as },
    {
        type: 'separator' },
    {
      type: 'text',
      label: 'Export a Copy',
      handler: () => {
        download_file(current_filename || 'script.js', model.getValue()) } }] },
  {
    label: 'Run',
    items: [{
      type: 'text',
      label: 'In New Window (Shift+F4)',
      handler: () => {
        output_element = html_element('div', function() {
          this.style.width = '100%'
          this.style.height = '100%' }, [])
        const op = create_pane(output_element)
        op[0].set_title("Output")
        run() } },
    {
      type: 'text',
      label: 'In Previous Window (F4)',
      handler: () => {
        run() } }] }])
  let output_element: HTMLElement | undefined
  const print = (s: string) => {
    output.appendChild(text_node(s)) }
  const open_output = () => {
    output_element = html_element('div', function() {}, [])
    const op = create_pane(output_element)
    op[0].set_title("Output")
    op[0].add_close_handler(() => {
      output_element = undefined })}
  const print_error = (e: unknown) => {
    output.appendChild(html_element('div', function() {
      this.style.whiteSpace = 'pre'
      this.style.borderColor = 'white'
      this.style.borderStyle = 'solid'
      this.style.borderWidth = '1px'
      this.style.marginTop = '4px'
      this.style.marginBottom = '4px'
      this.style.marginLeft = '8px'
      this.style.marginRight = '8px'
      this.style.padding = '8px' }, [
      text_node(e instanceof Error ? `${e.message}${e.stack ? `\n\n${e.stack}` : ``}` : 'An unknown exception occurred.')])) }
  const run = async () => {
    output.innerHTML = ''
    try {
      const elem = await run_script(model.getValue(), print)
      if (elem instanceof Node) {
        if (!output_element) {
          open_output() }
        if (output_element) {
          output_element.innerHTML = ''
          output_element.appendChild(elem) } } }
    catch (e) {
      print_error(e) } }
  input.addEventListener('keydown', async e => {
    if (e.key === 'F4') { await run() } })
  const output = html_element('div', function () {
    this.style.whiteSpace = "pre-wrap"
    this.style.overflowWrap = "break-word"
    this.style.overflowX = "hidden"
    this.style.overflowY = "scroll"
    this.style.wordBreak = "break-all"
    this.style.borderTopColor = 'white'
    this.style.borderTopStyle = 'solid'
    this.style.borderTopWidth = '1px'
    this.style.whiteSpace = 'pre-wrap'
    this.style.wordBreak = 'anywhere'
    this.style.flexGrow = '1'
    this.style.flexShrink = '1' }, [])
  const all = html_element('div', function() {
    this.style.height = '100%'
    this.style.display = 'flex'
    this.style.flexDirection = 'column' }, [
    menu,
    input,
    output])
  const [pane, user] = create_pane(all)
  set_title()
  return user }
