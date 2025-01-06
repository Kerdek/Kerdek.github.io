import { read, pretty, simplify, implement, partial_differential } from './lang.js'

const iota = n => Array(n).keys()
const iota2 = n => [...iota(n), n]

const map = f => (...x) => x.map(f)
const mapz = f => (...x) => x.map(x => f(...x))

const mix2 = t => {
  const tp = 1.0 - t
  return (a, b) => tp * a + t * b }

// ---------------------------------------------

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

const drawplot = (
  title_text,
  bottom_axis_text,
  left_axis_text,
  f, segment_count,
  xmin, xmax,
  ymin, ymax, diagonal) => {

  const margin = 0.1 * diagonal

  const xinterval = xmax - xmin
  const yinterval = ymax - ymin

  const sqr = x => Math.pow(x, 2.0)

  const frame_aspect_ratio = yinterval / xinterval
  const frame_aspect_ratio2 = sqr(frame_aspect_ratio)
  const iar = 1.0 / frame_aspect_ratio
  const arnum = Math.sqrt((frame_aspect_ratio2 + 1.0) * sqr(diagonal) - 2.0 * sqr((frame_aspect_ratio - 1.0) * margin))

  const width = (arnum + 2.0 * (frame_aspect_ratio2 - frame_aspect_ratio) * margin) / (frame_aspect_ratio2 + 1.0)
  const height = (arnum + 2.0 * (iar - 1.0) * margin) / (frame_aspect_ratio + iar)

  const double_margin = 2.0 * margin

  const title_size = 0.02 * diagonal

  const frame_width = width - double_margin
  const frame_height = height - double_margin

  const grid_stroke_width = 0.00025 * diagonal
  const axis_stroke_width = 0.0005 * diagonal

  const frame_left = margin
  const frame_right = width - margin
  const frame_top = margin
  const frame_bottom = height - margin

  const axis_label_size = 0.017 * diagonal

  const grid_spacing = 0.5

  const grid_label_padding = 0.02 * diagonal
  const grid_label_size = 0.02 * diagonal

  const horizontal_px_per_unit = frame_width / xinterval
  const vertical_px_per_unit = frame_height / yinterval

  const grid_label_division_x = Math.ceil(grid_label_size / horizontal_px_per_unit / grid_spacing)
const grid_label_division_y = Math.ceil(grid_label_size / vertical_px_per_unit / grid_spacing)

  const grid_label_left_enable = true
  const grid_label_bottom_enable = true

  const xtow = x => margin + (x - xmin) * horizontal_px_per_unit
  const ytoh = y => margin + (ymax - y) * vertical_px_per_unit

  const make_grid = (min, max, spacing, px_per_unit) => {
  const num_lines = (max - min) / spacing
  const lines = []
  for (let x = Math.ceil(min / spacing) * spacing, i = 0; i <= num_lines; x += spacing, i++) {
    const w = (x - min) * px_per_unit
    lines.push([x, w]) }
  return lines }

  const make_grid_labels = (lines, division) => {
  const labels = []
  for (let i = 0; i < lines.length; i++) {
    const [x, w] = lines[i]
    if (Math.floor(x / grid_spacing) % division === 0) {
      labels.push(i) } }
  return labels }

const vertical_grid_positions = make_grid(xmin, xmax, grid_spacing, horizontal_px_per_unit)
const horizontal_grid_positions = make_grid(ymax, ymin, -grid_spacing, -vertical_px_per_unit)

  const vertical_label_positions = make_grid_labels(vertical_grid_positions, grid_label_division_y)
  const horizontal_label_positions = make_grid_labels(horizontal_grid_positions, grid_label_division_x)

  const points = iota2(segment_count)
  const segments = []

  if (typeof f !== 'function') {
    throw new TypeError('the term is not a function') }
  // const f_disco = f(discos())

  // output.appendChild(t(`[${Object.keys(f_disco).map(i => `${i}: ${f_disco[i]}`).join(', ')}]`))

  for (let i = 0; i < points.length; i++) {
    const x = xmin + i * (xmax - xmin) / segment_count
    let y = f(x)
    if (Array.isArray(y)) {
      y = y.flat() }
    else {
      y = [y] }
    points[i] = [x, y] }

  {
    let [xp, yps] = points[0]
    for (let i = 1; i < points.length; i++) {
      const [x, ys] = points[i]
      for (const i in ys) {
        const y = ys[i]
        const yp = yps[i]
        let t0 = 0
        let t1 = 1
        if (yp > ymax) {
          t0 = (ymax - yp) / (y - yp) }
        if (yp < ymin) {
          t0 = (ymin - yp) / (y - yp) }
        if (y > ymax) {
          t1 = (ymax - yp) / (y - yp) }
        if (y < ymin) {
          t1 = (ymin - yp) / (y - yp) }
        if (t1 > t0 && isFinite(yp) && isFinite(y)) {
          let s0 = mix2(Math.max(0, t0))
          let s1 = mix2(Math.min(1, t1))
          segments.push([[
            xtow(s0(xp, x)),
            ytoh(s0(yp, y))], [
            xtow(s1(xp, x)),
            ytoh(s1(yp, y))]]) } }
      xp = x
      yps = ys } }

  const svg_element = element(x => document.createElementNS('http://www.w3.org/2000/svg', x))

  const svg = svg_element('svg')
  const svg_g = svg_element('g')
  const svg_title = svg_element('title')
  const svg_path = svg_element('path')
  const svg_polygon = svg_element('polygon')
  const svg_text = svg_element('text')
  const svg_style = svg_element('style')

  const svg_polygon_points = attrs => (...pts) => svg_polygon({ ...attrs,
    points: pts.map(p => p.map(e => `${e}`).join(',')).join(' ') })()

  const svg_path_points = attrs => (...pts) => svg_path({ ...attrs,
    d: `M ${pts.map(p => p.map(e => `${e}`).join(' ')).join(' L ')}` })()

  const svg_path_segs = attrs => (...segs) => svg_path({ ...attrs,
    d: `${segs.map(([a, b]) => `M ${a.map(e => `${e}`).join(' ')} L ${b.map(e => `${e}`).join(' ')}`).join(' ')}` })()

  const doc = svg({ width, height, style: "overflow: visible" })
  const style = s => svg_style({ type: "text/css" })(t(s))
  const group = cls => (...children) => svg_g({ class: cls })(...children)
  const title = name => svg_title({})(t(name))
  const text = (x, y) => svg_text({ x, y })

  const gridclass = z => ({ class: z === 0 ? "axis" : "grid" })
  return doc(
    style(`
      .grid {
        stroke-width: ${grid_stroke_width}px; }
      .axis {
        stroke-width: ${axis_stroke_width}px; }`),
    group('title')(
      svg_text({
        x: width / 2, y: frame_top / 2,
        style: `
          dominant-baseline: middle;
          text-anchor: middle;
          font-size: ${title_size}px;` })(title_text)),
    group('plotLine')(
      title('f'),
      svg_path_segs({ style: `
        stroke-linecap: round;
        stroke-width: ${0.001 * diagonal}px;` })(...segments)),
    group('frame')(
      svg_polygon_points({ style: `
        stroke-linecap: round;
        stroke-width: ${0.001 * diagonal}px;`})(
        [frame_left, frame_top],
        [frame_left, frame_bottom],
        [frame_right, frame_bottom],
        [frame_right, frame_top])),
    svg_g({
        class: `axisLabels`,
        style: `
          dominant-baseline: middle;
          text-anchor: middle;
          font-size: ${axis_label_size}px;`})(
      svg_text({
        x: 0, y: 0,
        transform: `
          translate(${grid_label_padding}, ${height / 2})
          rotate(90)` })(left_axis_text),
      svg_text({
        x: 0, y: 0,
        transform: `
          translate(${width / 2}, ${height - grid_label_padding})` })(bottom_axis_text)),
    svg_g({
      transform: `
        translate(${frame_left}, ${frame_top})`})(
        ...horizontal_grid_positions.map(([y, h]) => svg_path_points(gridclass(y))([0, h], [frame_width, h])),
        ...vertical_grid_positions.map(([x, w]) => svg_path_points(gridclass(x))([w, 0], [w, frame_height]))),
    svg_g({
      class: `gridLabels`,
      style: `
        dominant-baseline: middle;
        font-size: ${grid_label_size}px;` })(
      ...(!grid_label_left_enable ? [] : [
        svg_g({
          style: `text-anchor: end;`,
          transform: `
            translate(${margin}, ${margin})`})(
          ...horizontal_label_positions.map(i => {
            const [y, h] = horizontal_grid_positions[i]
            return text(-grid_label_padding, h)(`${y}`) }))]),
      ...(!grid_label_bottom_enable ? [] : [
        svg_g({
          style: `text-anchor: begin;`,
          transform: `
            translate(${margin}, ${frame_bottom})
            rotate(90)` })(
          ...vertical_label_positions.map(i => {
            const [x, w] = vertical_grid_positions[i]
            return text(grid_label_padding, -w)(`${x}`) }))]))) }

const html_element = element(x => document.createElement(x))
const html_div = html_element('div')
const html_span = html_element('span')

document.title = 'hi'

map(style_rule)(
  `@font-face {
    font-family: Typewriter;
    src: url('../cmuntt.ttf') }`,

  `@media (prefers-color-scheme: light) {
    :root {
      --foreground_color: black;
      --dim_color: gray;
      --background_color: white; } }`,

  `@media (prefers-color-scheme: dark) {
    :root {
      --foreground_color: white;
      --dim_color: gray;
      --background_color: black; } }`,

  `* { margin: 0; padding: 0 }`,

  `body {
    font-family: Typewriter;
    font-size: 30pt;
    line-height: 35pt;
    background: var(--background_color);
    color: var(--foreground_color);
    caret-color: var(--foreground_color);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 100vh; }`,

  `.formula {
    flex: 0 1 auto;
    white-space: pre;
    outline: none;
    height: 50pt;
    overflow: scroll;
    resize: vertical; }`,

  `.entry {
    white-space: nowrap;
    border: 1px solid white;
    outline: none;
    height: 50pt;
    display: inline-flex;
    flex-direction: column;
    justify-content: center; }`,

  `.limit {
    text-align: center;
    width: 30%; }`,

  `.segments {
    text-align: center;
    width: 30%; }`,

  `.diagonal {
    text-align: center;
    width: 30%; }`,

...mapz((cls, fill, stroke) =>
  `#plot .${cls} { fill: ${fill}; stroke: ${stroke}; }`)(
  ['title', 'var(--foreground_color)', 'none'],
  ['axisLabels', 'var(--foreground_color)', 'none'],
  ['gridLabels', 'var(--foreground_color)', 'none'],
  ['plotLine', 'none', 'var(--foreground_color)'],
  ['grid', 'none', 'var(--foreground_color)'],
  ['axis', 'none', 'var(--foreground_color)'],
  ['frame', 'none', 'var(--foreground_color)']))

// const equation = [ifx(ifx(ref('x'), '*', ref('x')), '+', ifx(ref('y'), '*', ref('y'))), ifx(ref('R'), '*', ref('R'))]

// const isofunction = ifx(equation[0], '-', equation[1])

const default_formula_value =
// 'x => x'
// '(sin => x => 0.3 + 0.25 * (x + 0.5) * (2.0 + sin(20.0 * x)))(Math["sin"])'
// '(lu => x => lu([0, 2, 1, -1, -1, -2, 3, 1], x + 4))((x, y) => x[Math["floor"](y)])'
// 'x => [1, x, 1/2 * x ** 2]'
// 'x => ++x'
// 'x => (-x) ** (-1)'
// 'x => (z => !z + +-x - ~x * 4 / 10 ** x)(0)'
// `x => map(((i, c) => () => (r => (i++, c /= i, r))(c * x ** i))(0, 1))(...Array(10))`
`x * x`

document.body.style.display = "flex"

const formula = html_div({ class: 'formula' })(t(default_formula_value))
const [xmin, xmax, ymin, ymax] = [-4, 4, -4, 4].map(i => html_span({ class: 'limit entry' })(t(`${i}`)))
const segments = html_span({ class: 'segments entry' })(t(`1000`))
const diagonal = html_span({ class: 'diagonal entry' })(t(`1000`))

const output = html_div({ style: 'white-space: pre-wrap;' })()

const div_center = html_div({ style: "text-align: center;" })

const put = x => document.body.appendChild(x)

put(
  html_div({})(formula))
put(html_div({ style: 'flex: 1 1 auto; overflow: hidden; border-top: 1px solid white; display: flex; flex-flow: row;' })(
    html_div({ style: 'flex: 0 0 auto; resize: horizontal; overflow: hidden;' })(
      div_center(t('x from '), xmin, t(' to '), xmax),
      div_center(t('y from '), ymin, t(' to '), ymax),
      div_center(segments, t(' segments')),
      div_center(diagonal, t(' diagonal pixels'))),

    html_div({ style: 'flex: 1 1 auto; overflow: scroll;' })(
      output)))

const update = async () => {
  const pfp = x => parseFloat(x.innerHTML)

  output.innerHTML = ''
  try {
    const f_tree = simplify(await read(formula.textContent))
    const df_tree = simplify(partial_differential("x", f_tree))
    const ddf_tree = simplify(partial_differential("x", df_tree))
    const dddf_tree = simplify(partial_differential("x", ddf_tree))
    const plot = drawplot(`f(x) = ${pretty(f_tree)}`, 'x', 'f(x)', x => implement({ x: x }, f_tree),
      pfp(segments),
      ...[xmin, xmax, ymin, ymax].map(pfp), pfp(diagonal))
      const dplot = drawplot(`f'(x) = ${pretty(df_tree)}`, `x`, `f'(x)`, x => implement({ x: x }, df_tree),
      pfp(segments),
      ...[xmin, xmax, ymin, ymax].map(pfp), pfp(diagonal))
    const ddplot = drawplot(`f''(x) = ${pretty(ddf_tree)}`, `x`, `f''(x)`, x => implement({ x: x }, ddf_tree),
      pfp(segments),
      ...[xmin, xmax, ymin, ymax].map(pfp), pfp(diagonal))
    const dddplot = drawplot(`f'''(x) = ${pretty(dddf_tree)}`, `x`, `f'''(x)`, x => implement({ x: x }, dddf_tree),
      pfp(segments),
      ...[xmin, xmax, ymin, ymax].map(pfp), pfp(diagonal))
    plot.id = 'plot'
    dplot.id = 'plot'
    ddplot.id = 'plot'
    dddplot.id = 'plot'
    output.appendChild(div_center(plot))
    output.appendChild(div_center(dplot))
    output.appendChild(div_center(ddplot))
    output.appendChild(div_center(dddplot)) }
  catch (e) {
    output.append(t(e.toString()))
    return } }

const textboxes = [formula, xmin, xmax, ymin, ymax, segments, diagonal]

for (const e of textboxes) {
  e.toggleAttribute('contenteditable')
  e.setAttribute('spellcheck', 'false')
  e.addEventListener('input', update) }

await update()

top.oncopy = e => {
const o = document.getSelection()
const r = o.getRangeAt(0)
e.clipboardData?.clearData()
if (!r || r.endContainer != r.startContainer || !textboxes.some(x => x === r.startContainer.parentElement)) {
return true }
else {
const n = r.startContainer
const txt = n.nodeValue.slice(r.startOffset, r.endOffset)
e.clipboardData?.setData('text/plain', txt)
return false } }

top.onpaste = e => {
const c = e.clipboardData?.getData('text/plain');
if (!c) return false;
const o = document.getSelection()
const r = o.getRangeAt(0)
if (!r || r.endContainer != r.startContainer || !textboxes.some(x => x === r.startContainer.parentElement)) {
return false }
else {
const s = r.startContainer.nodeValue
const x = r.startOffset
const z = x + c.length
r.startContainer.nodeValue = s.substring(0, x) + c + s.substring(r.endOffset)
r.setStart(r.startContainer, z)
r.setEnd(r.startContainer, z)
update()
return false } }
