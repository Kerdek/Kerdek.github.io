export {}

const AsyncFunction = async function () {}.constructor

const run_script = (text: string, print: (s: string) => void): Promise<unknown> => {
const go = async (text: string) => {
  const include = async (name: string) => {
    const text = await (await fetch(new URL(`${document.documentURI}/../${name}`).toString())).text()
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

const elem = await run_script(await (await fetch('./index.js')).text(), console.log)
if (elem instanceof Node) {
  document.body.appendChild(elem) }
else {
  console.log("Returned value was not a Node.") }