await document.fonts.ready

await new Promise(cb => {
  const js = document.createElement('script')
  js.src = '../monaco/vs/loader.js'
  js.type = 'text/javascript'
  js.addEventListener('load', cb)
  document.head.appendChild(js) })

require.config({
  paths: {
    vs: new URL(`${document.documentURI}/../../monaco/vs`).toString() } })

await new Promise(cb => require(['vs/editor/editor.main'], cb))

export const languages = monaco.languages
export const editor = monaco.editor