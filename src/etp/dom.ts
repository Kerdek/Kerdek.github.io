import { dj } from "./di.js"

export const
  elm = <K extends keyof HTMLElementTagNameMap>(tag: K, mod: (e: HTMLElementTagNameMap[K]) => void): HTMLElementTagNameMap[K] => {
    const e = document.createElement(tag)
    mod.apply(e, [e])
    return e },

  ela = async <K extends keyof HTMLElementTagNameMap>(tag: K, mod: (e: HTMLElementTagNameMap[K]) => Promise<void>): Promise<HTMLElementTagNameMap[K]> => {
    const e = document.createElement(tag)
    await mod.apply(e, [e])
    return e },

  txt = (s: string) => document.createTextNode(s),

  css = dj(() => {
    const style = document.head.appendChild(
      document.createElement('style'))
    const ss = style.sheet
    return ss ? (x: string) => ss.insertRule(x, 0) : () => {} }),

  download = (text: string, title: string) => {
    const blob = new Blob([text], {
      type: "text/plain" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = title
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url) },

  prompt_file = async () => {
    let input = document.createElement('input')
    input.type = 'file'
    await new Promise(cb => {
      input.onchange = cb
      input.click() })
    let chapters = input.files
    return chapters && chapters[0] && await chapters[0].text() },

  hover_accent = (color: string, e: HTMLElement) => {
    e.addEventListener('pointerenter', () => {
      e.style.background = color })
    e.addEventListener('pointerleave', () => {
      e.style.removeProperty('background') }) }