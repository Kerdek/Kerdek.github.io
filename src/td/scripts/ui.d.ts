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

type PaneMenuDesc = { name: string, handler: () => void }

type UI = {
  create_pane: CreatePane,
  create_button: (text: string, mod: (this: HTMLDivElement) => void) => HTMLElement,
  create_textbox: (text: string, mod: (this: HTMLDivElement) => void) => HTMLElement,
  context_menu: (x: number, y: number, items: ContextMenuItem[]) => void,
  run_script: (text: string, print: (s: string) => void) => Promise<unknown>,
  add_menu_pane: (desc: PaneMenuDesc) => void }

interface Window {
  ui: UI }

declare const ui: UI