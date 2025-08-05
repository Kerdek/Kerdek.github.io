export const create_sandbox = (): (text: string) => Promise<unknown> => {
let work_queue: [string, (value: any) => void, (error: any) => void][] = []
let busy: boolean = false
let worker: Worker = new Worker("./worker.js")

const run = async (): Promise<void> => {
const q = work_queue
if (!busy) {
  busy = true
  for (;;) {
    const work = q.shift()
    if (!work) {
      break }
    await new Promise<void>(c => {
      const message = (e: MessageEvent) => {
        worker.onmessage = null
        worker.onerror = null
        work[1](e.data)
        c() }
      const error = (e: ErrorEvent) => {
        worker.onmessage = null
        worker.onerror = null
        work[2](new Error(e.message))
        c() }
        worker.onmessage = message
        worker.onerror = error
      worker.postMessage(work[0]) }) }
  busy = false } }

return (text: string): Promise<unknown> => {
const r = new Promise((c, r) => { work_queue.push([text, c, r]) })
run()
return r } }