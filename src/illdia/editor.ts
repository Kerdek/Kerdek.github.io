const include = (type: string, src: string) => new Promise(cb => {
  const js = document.createElement('script')
  js.src = src
  js.type = type
  js.addEventListener('load', cb)
  document.head.appendChild(js) })

await include('text/javascript', '../monaco/vs/loader.js')
require.config({ paths: { vs: new URL(`${document.documentURI}/../../monaco/vs`).toString() } })
await new Promise(cb => require(['vs/editor/editor.main'], cb))

monaco.editor.setTheme('hc-black')

export const create_editor = monaco.editor.create
