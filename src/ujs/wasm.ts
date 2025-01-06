import { ujs_load } from './ujs.js'

;(<() => void>(await ujs_load('./main.wasm'))._start)()