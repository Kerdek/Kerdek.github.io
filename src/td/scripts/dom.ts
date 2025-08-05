type CreateElement = <K extends keyof HTMLElementTagNameMap>(tag: K, mod: (this: HTMLElementTagNameMap[K]) => void, children: Node[]) => HTMLElementTagNameMap[K]
type CreateText = (s: string) => Text

export const pointer_hold = (elem: HTMLElement, button: number, id: number, lock: boolean, handler: (e: PointerEvent) => void) => {
  const move = (e: PointerEvent) => {
    if (e.pointerId === id) {
      handler(e) } }
  const end = (e: PointerEvent) => {
    if (e.pointerId === id && e.button === button) {
      document.removeEventListener("pointermove", move)
      document.removeEventListener("pointerup", end)
      document.exitPointerLock() } }
  document.addEventListener('pointermove', move)
  document.addEventListener('pointerup', end)
  if (lock && !document.pointerLockElement) {
    elem.requestPointerLock() } }

export const html_element: CreateElement = (tag, mod, children) => {
const elem = document.createElement(tag)
mod.apply(elem)
elem.append(...children)
return elem }

export const text_node: CreateText = s =>
document.createTextNode(s)
