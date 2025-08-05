import { Scene } from './desc.js'
import { e, pointer_hold, t } from './dom.js'
import { add_geometry_browser } from './geometry_browser.js'
import { add_material_browser } from './material_browser.js'
import { add_script_browser } from './script_browser.js'
import { add_script_editor } from './script_editor.js'

document.title = 'Four'

window.addEventListener('contextmenu', e => {
  e.stopPropagation()
  e.preventDefault()
  return false }, true)

window.onbeforeunload = () => true

const style_rule: (x: string) => number = (() => {
const style = document.head.appendChild(document.createElement('style'))
const ss = style.sheet
return ss ? x => ss.insertRule(x, 0) : () => -1 })()

style_rule(`html {
width: 100%;
height: 100%; }`)
style_rule(`body {
height: 100%;
margin: 0;
padding: 0;
font-size: 13px;
background: black;
overflow: hidden;
color: white;
caret-color: white; }`)

export const button = (text: string, mod: (this: HTMLDivElement) => void) => e('div', function () {
this.style.userSelect = "none"
this.style.whiteSpace = "pre"
this.style.display = "flex"
this.style.justifyContent = "center"
this.style.alignItems = "center"
this.style.overflow = "hidden"
this.style.borderStyle = "solid"
this.style.borderWidth = "1px"
this.style.borderColor = "white"
this.style.height = '18px'
this.style.margin = '1px'
this.style.paddingLeft = '8px'
this.style.paddingRight = '8px'
this.style.cursor = "pointer"
this.addEventListener('mouseenter', () => {
  this.style.background = "white"
  this.style.color = "black" })
this.addEventListener('mouseleave', () => {
  this.style.removeProperty("background")
  this.style.removeProperty("color") })
mod.apply(this) }, [
t(text)])

export const textbox = (text: string, mod: (this: HTMLDivElement) => void) => e('div', function () {
this.toggleAttribute('contenteditable')
this.style.whiteSpace = "pre"
this.style.display = "flex"
this.style.justifyContent = "start"
this.style.alignItems = "center"
this.style.overflow = "scroll"
this.style.borderStyle = "solid"
this.style.borderWidth = "1px"
this.style.borderColor = "white"
this.style.height = '18px'
this.style.margin = '1px'
this.style.paddingLeft = '8px'
this.style.paddingRight = '8px'
this.style.cursor = 'text'
mod.apply(this) }, [
t(text)])

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
        e('div', function () {
          this.style.height = '1px'
          this.style.background = 'white'
          this.style.marginLeft = '8px'
          this.style.marginRight = '8px' }, []) :
      item.type === 'text' ?
        e('div', function () {
          this.style.userSelect = "none"
          this.style.display = "flex"
          this.style.justifyContent = "start"
          this.style.alignItems = "center"
          this.style.height = '18px'
          this.style.margin = '1px'
          this.style.paddingLeft = '8px'
          this.style.paddingRight = '8px'
          this.style.cursor = "pointer"
          this.addEventListener('pointerdown', e => {
            if (e.button === 0) {
              item.handler() } })
          this.addEventListener('mouseenter', () => {
            this.style.background = "white"
            this.style.color = "black" })
          this.addEventListener('mouseleave', () => {
            this.style.removeProperty("background")
            this.style.removeProperty("color") }) }, [
          t(item.label)]) :
      item) }
  context_menu_element = e('div', function () {
    this.style.zIndex = '2'
    this.style.background = 'black'
    this.style.borderStyle = "solid"
    this.style.borderWidth = "1px"
    this.style.borderColor = "white"
    this.style.position = 'absolute'
    this.style.overflow = 'hidden' }, elems)
  document.body.appendChild(context_menu_element)
  context_menu_element.style.left = `${x + context_menu_element.offsetWidth > document.body.offsetWidth ? x - context_menu_element.offsetWidth : x}px`
  context_menu_element.style.top = `${y + context_menu_element.offsetHeight > document.body.offsetHeight ? y - context_menu_element.offsetHeight : y}px`
  const pointerdown = () => {
    if (context_menu_element) {
      document.body.removeChild(context_menu_element)
      context_menu_element = undefined }
    window.removeEventListener('pointerdown', pointerdown, true) }
  window.addEventListener('pointerdown', pointerdown, true) }

const panes: HTMLElement[] = []
const closers = new Set<() => void>()

const activate = (p: HTMLElement) => {
const i = parseInt(p.style.zIndex)
for (const pane of panes) {
  const j = parseInt(pane.style.zIndex)
  if (j > i) {
    pane.style.zIndex = `${j - 1}` } }
p.style.zIndex = `${panes.length - 1}` }

export type Pane = {
  get_selection(): Selection | null
  get_width(): number,
  get_height(): number,
  add_resize_handler(handler: (w: number, h: number) => void): void
  remove_resize_handler(handler: (w: number, h: number) => void): void
  add_close_handler(handler: () => void): void
  remove_close_handler(handler: () => void): void
  set_title(title: string): void
  close(): void }

export type CreatePaneOptions = {
  autosize?: true | false }

export type CreatePaneHandler = (functions: Pane) => HTMLElement

let pane_spawn = 100

export const create_pane = (options: CreatePaneOptions, contents: CreatePaneHandler) => {
  if (pane_spawn > document.body.clientHeight - 100) {
    pane_spawn -= document.body.clientHeight - 200 }
  let pos: [number, number] = [pane_spawn, pane_spawn]
  let size: [number, number] = [700, 700]

  pane_spawn += 100

  const resize_handlers = new Set<(w: number, h: number) => void>()
  const close_handlers = new Set<() => void>()

  const close = () => {
    for (const handler of close_handlers) {
      handler() }
    const i = panes.indexOf(pane)
    if (i !== -1) {
      panes.splice(i, 1) }
    closers.delete(close)
    document.body.removeChild(pane) }

  const functions: Pane = {
    get_selection() {
      const s = document.getSelection()
      if (!s || !pane.contains(s.getRangeAt(0).commonAncestorContainer)) {
        return null }
      return s },
    get_width() {
      return size[0] },
    get_height() {
      return size[1] },
    add_resize_handler: handler => {
      resize_handlers.add(handler) },
    remove_resize_handler: handler => {
      resize_handlers.delete(handler) },
    add_close_handler: handler => {
      close_handlers.add(handler) },
    remove_close_handler: handler => {
      close_handlers.delete(handler) },
    close,
    set_title: title => {
      title_text.data = title } }

  const title_text = t('')
  const title_text_box = e('div', function() {
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
          pane.style.left = `${pos[0]}px`
          pane.style.top = `${pos[1]}px` }) }
      else if (e.button === 2) {
        context_menu(e.clientX, e.clientY, [{
          type: 'text',
          label: 'Close',
          handler: () => {
            close() } }]) } }) }, [
    title_text])

  const resize_button = button("⤢", function () {
    this.style.margin = "1px"
    this.style.width = "18px"
    this.style.height = "18px"

    this.addEventListener('pointerdown', async e => {
      if (e.button === 0) {
        const drag_start: [number, number] = [e.screenX, e.screenY]
        const pos_start: [number, number] = [...pos]
        const size_start: [number, number] = [...size]
        pointer_hold(this, 0, e.pointerId, false, e => {
          if (drag_start) {
            size[0] = size_start[0] + e.screenX - drag_start[0]
            size[0] = Math.max(size[0], title_button_area.scrollWidth)
            size[0] = Math.max(size[0], 100 - pos_start[0])
            size[1] = size_start[1] + drag_start[1] - e.screenY
            size[1] = Math.max(size[1], titlebar.scrollHeight)
            size[1] = Math.max(size[1], size_start[1] + 100 + pos_start[1] - document.body.scrollHeight)
            size[1] = Math.min(size[1], size_start[1] + pos_start[1])
            pos[1] = pos_start[1] + size_start[1] - size[1]
            pane.style.top = `${pos[1]}px`
            pane.style.width = `${size[0]}px`
            pane.style.height = `${size[1]}px`
            for (const handler of resize_handlers) {
              handler(...size) } } }) } }) })

  const close_button = button("✕", function () {
    this.style.margin = "1px"
    this.style.width = "18px"
    this.style.height = "18px"
    this.addEventListener("click", () => {
      close() }) })
  const title_button_area = e('div', function() {
    this.style.display = "flex"
    this.style.flexDirection = "row"
    this.style.flexBasis = "auto"
    this.style.flexGrow = "0"
    this.style.flexShrink = "0" }, [
    resize_button,
    close_button])
  const titlebar = e('div', function() {
    this.style.userSelect = "none"
    this.style.borderBottomStyle = "solid"
    this.style.borderBottomWidth = "1px"
    this.style.borderBottomColor = "white"
    this.style.alignItems = "center"
    this.style.display = "flex"
    this.style.flexDirection = "row"
    this.style.flexGrow = "0"
    this.style.flexShrink = "0"
    this.style.flexBasis = "auto" }, [
    title_text_box,
    title_button_area])
  const elem = contents(functions)
  const contents_box = e('div', function() {
    this.style.flexGrow = "1"
    this.style.flexShrink = "0"
    this.style.flexBasis = "0"
    this.style.overflow = "hidden"  }, [
    elem ])
  const pane = e('div', function() {
    this.style.background = "black"
    this.style.borderStyle = "solid"
    this.style.borderWidth = "1px"
    this.style.borderColor = "white"
    this.style.display = "flex"
    this.style.flexDirection = "column"
    this.style.position = "absolute"
    this.style.left = `${pos[0]}px`
    this.style.top = `${pos[1]}px`
    this.style.width = `${size[0]}px`
    this.style.height = `${size[1]}px`
    this.style.overflow = "hidden"
    this.style.zIndex = `${panes.length}`

    this.addEventListener('mousedown', () => {
      activate(this) }) }, [
    titlebar,
    contents_box])
  panes.push(pane)
  closers.add(close)
  document.body.appendChild(pane)
  if (options.autosize) {
    size = [elem.offsetWidth + 2, elem.offsetHeight + 25]
    pane.style.width = `${size[0]}px`
    pane.style.height = `${size[1]}px` }
  activate(pane) }

export type Vars = { [i in string]: any }

let global: Vars = {}

let scene: Scene = {
  scripts: {},
  materials: {},
  surfaces: {},
  geometry: {} }

const scene_changed_handlers = new Set<() => void>()

export const add_scene_changed_handler = (handler: () => void) => {
  scene_changed_handlers.add(handler) }

export const remove_scene_changed_handler = (handler: () => void) => {
  scene_changed_handlers.delete(handler) }

export const scene_changed = () => {
  for (const handler of scene_changed_handlers) {
    handler() }}

document.body.appendChild(e('div', function () { }, [
  button('File', function () {
    this.style.display = 'inline-flex'
    this.addEventListener('click', async () => {
      context_menu(this.offsetLeft, this.offsetTop + this.offsetHeight, [{
        type: 'text',
        label: 'New',
        handler: () => {
          if (!window.confirm("Erase everything?")) {
            return }
          scene = {
            scripts: {},
            geometry: {},
            materials: {},
            surfaces: {} }
          for (const closer of closers) {
            closer() }
          scene_changed() } },{
        type: 'text',
        label: 'Open',
        handler: () => {
          let input = document.createElement('input')
          input.type = 'file'
          input.onchange = async () => {
            let files = input.files
            if (!files || !files[0]) {
              return }
            const text = await files[0].text()
            scene = JSON.parse(text)
            global = {}
            for (const closer of closers) {
              closer() }
            scene_changed() }
          input.click() } },
      {
        type: 'text',
        label: 'Save',
        handler: () => {
          const blob = new Blob([JSON.stringify(scene)], { type: "text/plain" })
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.style.display = 'none'
          a.href = url
          a.download = 'scene.json'
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          window.URL.revokeObjectURL(url) } }]) }) }),
  button('Window', function () {
    this.style.display = 'inline-flex'
    this.addEventListener('click', async () => {
      context_menu(this.offsetLeft, this.offsetTop + this.offsetHeight, [{
        type: 'text',
        label: 'Geometry Browser',
        handler: () => {
          add_geometry_browser(scene) } },
      {
        type: 'text',
        label: 'Material Browser',
        handler: () => {
          add_material_browser(scene) } },
      {
        type: 'text',
        label: 'Script Browser',
        handler: () => {
          add_script_browser(scene, global) } },
      {
        type: 'text',
        label: 'Script Editor',
        handler: () => {
          add_script_editor(scene, global, '', 'new_script') } }]) }) })]))