import { reduce, unthunk, set_cb_make, set_cb_change, set_cb_add_child, set_cb_remove_child } from './graph.js'
import { read, pretty } from './lang.js'

const iota = n => Array(n).keys()
const iota2 = n => [...iota(n), n]

const omap = f => o => {
  for (const i in o) {
    o[i] = f(o[i]) }
  return o }
const map = f => (...x) => x.map(f)
const mapz = f => (...x) => x.map(x => f(...x))
const sum = (...x) => x.reduce((a, b) => a + b, 0)
const id = x => x
const ii = i => (...x) => x[i]
const il = ([a, i]) => a[i]
const li = (...x) => x
const di = (...x) => f => f(...x)
const cdi = (...x) => e => () => e(...x)
const nd = (...k) => (...x) => f => f(...k)(...x)
const cs = x => () => x
const dim = m => (...x) => e => e[m](...x)
const tbl = o => kind => o[kind]
const mapr = f => (...a) => a.map(([l, x]) => [l, f(x)])

const style_rule = (() => {
  const style = document.head.appendChild(document.createElement('style'))
  const ss = style.sheet
  return ss ? x => ss.insertRule(x, 0) : () => -1 })()

const element = create => tag => attributes => (...children) => {
  const elem = create(tag);
  for (const i in attributes) {
    elem.setAttribute(i, attributes[i]) }
  elem.append(...children);
  return elem; }

const t = s => document.createTextNode(s)

const html_element = element(x => document.createElement(x))
const html_div = html_element('div')

const svg_element = element(x => document.createElementNS('http://www.w3.org/2000/svg', x))
const svg_svg = svg_element('svg')
const svg_g = svg_element('g')
const svg_title = svg_element('title')
const svg_path = svg_element('path')
const svg_polygon = svg_element('polygon')
const svg_text = svg_element('text')
const svg_style = svg_element('style')

const svg_polygon_points = attrs => (...pts) => svg_polygon({ ...attrs,
  points: pts.map(p => p.map(e => `${e}`).join(',')).join(' ') })()

const svg_path_points_d = (...pts) => `M ${pts.map(p => p.map(e => `${e}`).join(' ')).join(' L ')}`

const svg_path_points = attrs => (...pts) => svg_path({ ...attrs,
  d: svg_path_points_d(...pts) })()

const svg_style_css = s => svg_element('style')({ type: "text/css" })(t(s))

document.title = 'hi'

map(style_rule)(
  `@font-face {
    font-family: CMU Typewriter Text;
    src: url('./cmuntt.ttf') }`,

  `:root {
    --foreground_color: white;
    --background_color: black; }`,

  `* { margin: 0; padding: 0 }`,

  `body {
    font-family: Typewriter;
    background: var(--background_color);
    color: var(--foreground_color); }`)

const input = html_div({ style: "height:13 pt; outline: none; border-bottom: 1px solid white" })()
input.toggleAttribute('contenteditable')

const width = 1920 * 2
const height = 1080 * 2

const transform = (x, y) => [width / 2 + x, height / 2 + y]

const disp = svg_svg({ viewBox: `0 0 ${width} ${height}` })(
  svg_style_css(`
    path {
      stroke: white;
      stroke-width: 3px; }
    polygon {
      fill: white; }
    text {
      font-family: CMU Typewriter Text;
      font-size: 40px;
      fill: white;
      dominant-baseline: middle;
      text-anchor: middle; }`))

const dl = html_element('input')({})()
dl.type = 'checkbox'
dl.id = 'dl'
const dl_label = html_element('label')({})(t('download frames'))
dl_label.setAttribute('for', dl.id)

const main = html_div({ style: "display: flex; flex-direction: column;"})(input, html_div({})(dl, dl_label), disp)

document.body.appendChild(main)

const cap = e =>
  e.kind === 'ref' ? e.sym.id :
  e.kind === 'str' ? `"${JSON.stringify(e.val).slice(1, -1)}"` :
  e.kind === 'num' ? `${e.val}` :
  e.kind === 'tru' ? 'true' :
  e.kind === 'fls' ? 'false' :
  e.kind === 'cst' ? 'const' :
  e.kind === 'jst' ? 'const' :
  e.kind === 'rec' ? 'rec' :
  e.kind === 'app' ? '$' :
  e.kind === 'add' ? '+' :
  e.kind === 'mul' ? '*' :
  e.kind === 'cns' ? ':' :
  e.kind === 'sub' ? '-' :
  e.kind === 'div' ? '/' :
  e.kind === 'mod' ? '%' :
  e.kind === 'ceq' ? '==' :
  e.kind === 'cne' ? '!=' :
  e.kind === 'cgt' ? '>' :
  e.kind === 'clt' ? '<' :
  e.kind === 'cge' ? '>=' :
  e.kind === 'cle' ? '<=' :
  e.kind === 'mem' ? '=' :
  e.kind === 'thk' ? ';' :
  e.kind === 'uni' ? `λ${e.sym.id}` :
  e.kind === 'ext' ? `∃` :
  e.kind === 'nym' ? `${e.sym.id} =` :
  '.'

const sim_objects = []

const add_child = e => c => {
  c.mass++
  e.children.push(c) }

const remove_child = e => c => {
  c.mass--
  e.children.splice(e.children.indexOf(c), 1) }

const add_object = (i, where, c, gc) => {
  let x = Math.sin(i)
  let y = Math.sin(i + 0.5)
  if (where) {
    x += where.x
    y += where.y }
  const term = {
    x, y,
    xv: 0, yv: 0,
    xa: 0, ya: 0,
    c, gc,
    mass: 0,
    children: [] }
  sim_objects.push(term)
  return term }

const repel_strength = 3000.0
const damp_strength = 200.0
const attract_strength = 0.03
const attract_distance = 80
const ndamp_strength = 0.1
const rough = 500
const global_damp = 0.99
const dt = 1.0

const repel = start => {
  const walk = oi => {
    if (n in oi) return
    oi[n] = null
    oi.children.forEach(walk) }
  const damp_repel = (oi, oj) => {
    const { x: xi, y: yi, xv: xvi, yv: yvi } = oi
    const { x: xj, y: yj, xv: xvj, yv: yvj } = oj
    const dx = xi - xj
    const dy = yi - yj
    const dxv = xvi - xvj
    const dyv = yvi - yvj
    const m = rough + dx * dx + dy * dy
    let push = 1.0 / m
    oi.xa -= damp_strength * dxv * push
    oi.ya -= damp_strength * dyv * push
    oj.xa += damp_strength * dxv * push
    oj.ya += damp_strength * dyv * push
    push *= repel_strength / Math.sqrt(m)
    oi.xa += push * dx
    oi.ya += push * dy
    oj.xa -= push * dx
    oj.ya -= push * dy }
  const damp_attract = (oi, oj) => {
    const { x: xi, y: yi, xv: xvi, yv: yvi } = oi
    const { x: xj, y: yj, xv: xvj, yv: yvj } = oj
    const dx = xi - xj
    const dy = yi - yj
    const dxv = xvi - xvj
    const dyv = yvi - yvj
    const m = rough + dx * dx + dy * dy
    let push =
      ndamp_strength * (dxv * dx + dyv * dy) / Math.sqrt(m)
      + attract_strength * (Math.sqrt(m) - attract_distance)
    push /= Math.sqrt(m)
    oi.xa -= push * dx
    oi.ya -= push * dy
    oj.xa += push * dx
    oj.ya += push * dy }
  const n = Symbol()
  walk(start)
  for (let i = 0; i < sim_objects.length; i++) {
    const oi = sim_objects[i]
    if (!(n in oi)) {
      oi.gc()
      sim_objects.splice(i, 1)
      i--
      continue }
    delete oi[n]
    for (let j = i + 1; j < sim_objects.length; j++) {
      damp_repel(oi, sim_objects[j]) }
    for (let j = 0; j < oi.children.length; j++) {
      const oj = oi.children[j]
      if (oj === oi) continue
      damp_attract(oi, oj) } }
  for (let i = 0; i < sim_objects.length; i++) {
    const oi = sim_objects[i]
    if (oi === start) {
      oi.x = oi.y = oi.xv = oi.yv = oi.xa = oi.ya = 0
      continue }
    oi.xv += oi.xa * dt / oi.mass
    oi.yv += oi.ya * dt / oi.mass
    oi.xv *= global_damp
    oi.yv *= global_damp
    oi.xa = 0
    oi.ya = 0
    oi.x += oi.xv * dt
    oi.y += oi.yv * dt }
  for (let i = 0; i < sim_objects.length; i++) {
    const oi = sim_objects[i]
    oi.c(oi) } }

const coop = (() => {
  const noop = () => {}
  let resume = [noop]
  return () => new Promise(c => {
    resume[0] = noop
    resume = [c]
    const my_resume = resume
    window.setTimeout(() => my_resume[0](), 0) }) })()

input.addEventListener('keydown', async ev => {
  try {
  if (ev.key === "Escape") {
    await coop() }
  if (ev.key === "Enter") {
    const cb_make = (e, a) => {
      if (e.kind === 'thk') return
      const term_element = svg_text({})(t(cap(e)))
      disp.appendChild(term_element)
      const term = add_object(counter++, lu.get(a), ap => {
        const [ax, ay] = transform(ap.x, ap.y)
        term_element.setAttribute('x', `${ax}`)
        term_element.setAttribute('y', `${ay}`)
        for (let i = 0; i < ap.child_edges.length; i++) {
          const [ep, eq, ek] = ap.child_edges[i]
          const [ex, ey] = transform(ep.x, ep.y)
          const dx = ex - ax
          const dy = ey - ay
          const m = Math.sqrt(dx * dx + dy * dy)
            const c = 40.0 * dx / m
            const s = 40.0 * dy / m
            const x0 = ax + c
            const y0 = ay + s
            const x1 = ex - c
            const y1 = ey - s
            switch (ek) {
              case 'rhs': // port tick
                eq.children[2].setAttribute('d', `M ${x0 + 0.3 * s},${y0 - 0.3 * c} L ${x0 - 0.3 * s},${y0 + 0.3 * c}`)
                eq.children[0].setAttribute('d', `M ${x0},${y0} L ${x1},${y1}`)
                break;
              case 'lhs': // child arrow
              case 'body':
                eq.children[1].setAttribute('points', `${x0 + 0.5 * c},${y0 + 0.5 * s} ${x0 + 0.3 * s},${y0 - 0.3 * c} ${x0 - 0.3 * s},${y0 + 0.3 * c}`)
              case 'name': // main edge
                eq.children[0].setAttribute('d', `M ${x0},${y0} L ${x1},${y1}`)
            } } },
      () => {
        disp.removeChild(term_element)
        lu.delete(e)
        while (term.child_edges.length != 0) {
          cb_remove_child2(term, term.child_edges[0][0]) } })
      term.elem = term_element
      term.child_edges = []
      lu.set(e, term)
      return term }

    const cb_change = e => {
      const s = lu.get(e).elem
      if (s === undefined) return
      s.innerHTML = ''
      s.appendChild(t(cap(e))) }

    const cb_add_child = (e, a, kind) => {
      const ep = lu.get(e)
      if (ep === undefined) return
      const ap = lu.get(a)
      if (ap === undefined) return
      add_child(ep)(ap)
      const eq =
        kind === 'name' ? svg_g({})(svg_path_points({ 'stroke-dasharray': '2, 5', style: 'stroke-width: 10px' })()) :
        kind === 'lhs' ? svg_g({})(svg_path_points({})(), svg_polygon_points({})()) :
        kind === 'rhs' ? svg_g({})(svg_path_points({})(), svg_polygon_points({})(), svg_path_points({})()) :
        kind === 'body' ? svg_g({})(svg_path_points({})(), svg_polygon_points({})()) :
        null
      ep.child_edges.push([ap, eq, kind])
      disp.appendChild(eq) }

    const cb_remove_child2 = (ep, ap) => {
        remove_child(ep)(ap)
        const epi = ep.child_edges.findIndex(x => x[0] === ap)
        disp.removeChild(ep.child_edges[epi][1])
        ep.child_edges.splice(epi, 1) }

    const cb_remove_child = (e, a) => {
      const ep = lu.get(e)
      if (ep === undefined) return
      const ap = lu.get(a)
      if (ap === undefined) return
      cb_remove_child2(ep, ap) }

    const download = name => {
      let link = document.createElement("a")
      document.body.appendChild(link)
      link.download = name
      link.href = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(disp)], { type: 'image/svg+xml' }))
      link.click()
      URL.revokeObjectURL(link.href)
      document.body.removeChild(link) }

    ev.preventDefault()

    set_cb_make(cb_make)
    set_cb_change(cb_change)
    set_cb_add_child(cb_add_child)
    set_cb_remove_child(cb_remove_child)

    const lu = new Map()
    let counter = 0

    let e = read(input.textContent)

    let i = 0
    for (const is = i + 240; i < is; i++) {
      repel(lu.get(e))
      await coop()
      if (dl.checked) download(`graph${i}.svg`) }
    for (;; i++) {
      repel(lu.get(e))
      await coop()
      if (dl.checked) download(`graph${i}.png`)
      let ep = reduce(e)
      if (!ep) break
      e = unthunk(ep) }
    for (const is = i + 240; i < is; i++) {
      repel(lu.get(e))
      await coop()
      if (dl.checked) download(`graph${i}.svg`) }

    return false } }
    catch (e) {
      main.appendChild(t(e.toString()))
    }})