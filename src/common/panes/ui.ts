import { colors } from '../colors.js'
import { mod, assign } from '../util/di.js'
import { elm, hover_accent, txt } from '../util/dom.js'

export type MenuBarItem = {
label: string,
tip: string,
items: DropDownMenuItem[] }

export type DropDownMenuItemText = {
type: 'text',
label: string,
tip: string,
handler?: () => void }

export type DropDownMenuItemSeparator = {
type: 'separator' }

export type DropDownMenuItem =
DropDownMenuItemText |
DropDownMenuItemSeparator

export type StatusBarItem = {
type: 'text',
label: Text,
mod: (e: HTMLElement) => void }

export type ToolTipItemElement = {
type: 'element',
mod: (e: HTMLElement) => void }

export type ToolTipItemSeparator = {
type: 'separator' }

export type ToolTipItem =
ToolTipItemElement |
ToolTipItemSeparator

export type DropDownMenuItems =
DropDownMenuItem[]

export type ToolTip = {
  items: ToolTipItem[],
  on_move?: (x: number, y: number) => void
  dispose?: () => void }

export const

separator = () => mod(elm('div'), e => {
  assign(e.style, {
    height: '1px',
    background: colors.foreground,
    marginLeft: '8px',
    marginRight: '8px' }) }),

simple_tool_tip = (e: HTMLElement, tip: string) => tool_tip(e, () => ({ items: [{ type: 'element', mod: e => { e.append(txt(tip)) } }] })),

tool_tip = (e: HTMLElement, body: () => ToolTip): () => void => {
let my_end: (() => void) | undefined
e.addEventListener('pointerenter', ev => {
  const
    refresh = (x: number, y: number, cx: number, cy: number) => {
      if (on_move) {
        on_move(cx, cy) }
      tip.style.removeProperty('left')
      tip.style.removeProperty('top')
      tip.style.removeProperty('right')
      tip.style.removeProperty('bottom')
      if (x > document.body.clientWidth / 2) {
        tip.style.right = `${document.body.clientWidth - x + 15}px` }
      else {
        tip.style.left = `${x + 15}px` }
      if (y > document.body.clientHeight / 2) {
        tip.style.bottom = `${document.body.clientHeight - y}px` }
      else {
        tip.style.top = `${y}px` } },
    end = () => {
      if (dispose) {
        dispose() }
      document.body.removeChild(tip)
      e.removeEventListener('pointerleave', leave)
      e.removeEventListener('pointercancel', leave)
      e.removeEventListener('pointermove', move) },
    leave = (evp: PointerEvent) => {
      if (evp.pointerId === ev.pointerId) {
        end() } },
    move = (evp: PointerEvent) => {
      if (evp.pointerId === ev.pointerId) {
        refresh(evp.pageX, evp.pageY, evp.offsetX, evp.offsetY) } }
  e.addEventListener('pointerleave', leave)
  e.addEventListener('pointercancel', leave)
  e.addEventListener('pointermove', move)
  const
    { items, on_move, dispose } = body(),
    tip = mod(elm('div'), e => {
      assign(e.style, {
        paddingLeft: '8px',
        paddingRight: '8px',
        zIndex: '100001',
        position: 'absolute',
        whiteSpace: 'pre-wrap',
        background: colors.ruler,
        pointerEvents: 'none',
        ...full_border })
      e.append(mod(elm('div'), e => {
        assign(e.style, {
          margin: '1px' })
        e.append(...items.map(item =>
          item.type === 'element' ? mod(elm('div'), item.mod) :
          separator())) })) })
  refresh(ev.pageX, ev.pageY, ev.offsetX, ev.offsetY)
  document.body.appendChild(tip)
  my_end = end })
return () => my_end && my_end() },

list_item = (text: string) =>
mod(elm('div'), e => {
  assign(e.style, {
    userSelect: 'none',
    whiteSpace: 'pre',
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',
    height: '18px',
    paddingLeft: '8px',
    paddingRight: '8px',
    cursor: 'pointer' })
  e.tabIndex = 0
  hover_accent(e, {
    background: colors.background }, {
    background: colors.ruler })
  e.append(
    txt(text)) }),

button = (text: string) =>
mod(elm('div'), e => {
  assign(e.style, {
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: colors.foreground,
    userSelect: 'none',
    whiteSpace: 'pre',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    height: '18px',
    paddingTop: '1px',
    paddingLeft: '8px',
    paddingRight: '8px',
    cursor: 'pointer' })
  e.tabIndex = 0
  hover_accent(e, {
    background: colors.background }, {
    background: colors.ruler })
  e.append(
    txt(text)) }),

text_box = (text: string): [Text, HTMLElement] => {
const node = txt(text)
return [node, mod(elm('div'), e => {
  e.contentEditable = 'plaintext-only'
  e.tabIndex = 0
  assign(e.style, {
    whiteSpace: 'pre',
    display: 'inline-flex',
    justifyContent: 'start',
    alignItems: 'center',
    overflow: 'scroll',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: colors.foreground,
    height: '18px',
    paddingLeft: '8px',
    paddingRight: '8px',
    cursor: 'text' })
  e.append(
    node, elm('br')) })] },

menu_bar_item = ({ label, tip, items}: MenuBarItem) =>
mod(elm('div'), e => {
  assign(e.style, {
    ...right_border,
    whiteSpace: 'pre',
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    paddingTop: '1px',
    paddingLeft: '8px',
    paddingRight: '8px',
    cursor: 'pointer' })
  e.tabIndex = 0
  simple_tool_tip(e, tip)
  e.addEventListener
  hover_accent(e, {
    background: colors.background }, {
    background: colors.ruler })
  e.addEventListener('pointerdown', ev => {
    const bcr = e.getBoundingClientRect()
    drop_down_menu(bcr.left, bcr.bottom, ev.pointerId, items) })
  e.append(
    txt(label)) }),

menu_bar = (items: MenuBarItem[]) =>
mod(elm('div'), e => {
  assign(e.style, {
    background: colors.background,
    userSelect: 'none',
    height: '18px',
    overflow: 'hidden',
    ...bottom_border })
  e.append(...items.map(menu_bar_item)) }),

status_bar_item = (text: Text) =>
mod(elm('div'), e => {
  assign(e.style, {
    background: colors.background,
    ...right_border,
    userSelect: 'none',
    whiteSpace: 'pre',
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    paddingTop: '1px',
    paddingLeft: '8px',
    paddingRight: '8px' })
  e.append(
    text) }),

status_bar = (items: StatusBarItem[]) =>
mod(elm('div'), e => {
  assign(e.style, {
    background: colors.background,
    height: '18px',
    overflow: 'hidden',
    ...top_border })
  e.append(...items.map(item =>
    mod(status_bar_item(item.label), item.mod))) }),

drop_down_menu = (x: number, y: number, pointer: number, items: DropDownMenuItems) => {
const elems: HTMLElement[] = []
for (const item of items) {
  elems.push(
    item.type === 'separator' ?
      separator() :
    item.type === 'text' ?
      mod(elm('div'), e => {
        assign(e.style, {
          userSelect: 'none',
          display: 'flex',
          justifyContent: 'start',
          alignItems: 'center',
          height: '18px',
          margin: '1px',
          paddingLeft: '8px',
          paddingRight: '8px',
          ...('handler' in item) ? {
            cursor: 'pointer' } : {
            color: colors.symbol } })
        if ('handler' in item) {
          hover_accent(e, {
            background: colors.background }, {
            background: colors.ruler }) }
        const end = simple_tool_tip(e, item.tip)
        e.addEventListener('pointerdown', ev => {
          end()
          if ('handler' in item) {
            if (ev.pointerId === pointer) {
              item.handler() } } })
        e.append(
          txt(item.label)) }) :
    item) }
  document.body.append(mod(elm('div'), e => {
    e.style.left = `${x + e.offsetWidth > document.body.offsetWidth ? x - e.offsetWidth : x}px`
    e.style.top = `${y + e.offsetHeight > document.body.offsetHeight ? y - e.offsetHeight : y}px`
    assign(e.style, {
      zIndex: `100000`,
      background: 'black',
      borderStyle: 'solid',
      borderWidth: '1px',
      borderColor: colors.foreground,
      position: 'absolute',
      overflow: 'hidden' })
    e.append(...elems)
    const click = (ev: PointerEvent) => {
      if (ev.pointerId === pointer) {
        document.body.removeChild(e)
        document.removeEventListener('pointercancel', click, true)
      document.removeEventListener('pointerdown', click, true) } }
    document.addEventListener('pointercancel', click, true)
    document.addEventListener('pointerdown', click, true) })) },

context_menu = (e: HTMLElement, items: (x: number, y: number) => DropDownMenuItems) => {
e.addEventListener('contextmenu', ev => {
  ev.stopPropagation()
  ev.preventDefault()
  drop_down_menu(ev.clientX, ev.clientY, (ev as PointerEvent).pointerId, items(ev.offsetX, ev.offsetY))
  return false }) },

full_border = {
  borderColor: colors.foreground,
  borderStyle: 'solid',
  borderWidth: '1px' },
bottom_border = {
  borderBottomColor: colors.foreground,
  borderBottomStyle: 'solid',
  borderBottomWidth: '1px' },
top_border = {
  borderTopColor: colors.foreground,
  borderTopStyle: 'solid',
  borderTopWidth: '1px' },
left_border = {
  borderLeftColor: colors.foreground,
  borderLeftStyle: 'solid',
  borderLeftWidth: '1px' },
right_border = {
  borderRightColor: colors.foreground,
  borderRightStyle: 'solid',
  borderRightWidth: '1px' },

text_output_area = () => mod(elm('div'), e => {
  assign(e.style, {
    position: 'absolute',
    inset: '0',
    cursor: 'text',
    wordBreak: 'anywhere',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'break-word',
    overflowX: 'hidden',
    overflowY: 'scroll', }) })
