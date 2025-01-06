(() => {
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

  const mix2 = t => {
    const tp = 1.0 - t
    return (a, b) => tp * a + t * b }

// ---------------------------------------------

  const { read, pretty, implement } = (() => {

    const pretty = (() => {
    const f = precedence => {
      const assoc_bin_op = (o, p) => (x, y) => `${g(p)('(')}${x(f(p - 1))}${o}${y(f(p - 1))}${g(p)(')')}`
      const left_assoc_bin_op = (o, p) => (x, y) => `${g(p)('(')}${x(f(p - 1))}${o}${y(f(p))}${g(p)(')')}`
      const right_assoc_bin_op = (o, p) => (x, y) => `${g(p)('(')}${x(f(p))}${o}${y(f(p - 1))}${g(p)(')')}`
      const prefix_unop = (o, p) => x => `${g(p)('(')}${o}${x(f(p - 1))}${g(p)(')')}`
      const postfix_unop = (o, p) => x => `${g(p)('(')}${x(f(p - 1))}${o}${g(p)(')')}`
      const literal = JSON.stringify
      const g = p => p > precedence ? cs('') : x => x
      return tbl({
        seq: right_assoc_bin_op(', ', 1),
        abs: (x, y, ...z) => {
          const h = z.length === 1 && y === undefined ? cs('') : id
          return `${g(3)('(')}${h('(')}${commas(z)}${rest(y, z)}${h(')')} => ${x(f(2))}${g(3)(')')}` },
        ...omap(x => right_assoc_bin_op(x, 2))({
          ass: ' = ', ada: ' += ', sua: ' -= ', mua: ' *= ', exa: ' **= ',
          dia: ' /= ', rea: ' %= ', lsa: ' <<= ', rsa: ' >>= ', raa: ' >>>= ',
          bca: ' &= ', xoa: ' ^= ', bda: ' |= ', lca: ' &&= ', lda: ' ||= ' }),
        ...omap(([x, p]) => left_assoc_bin_op(x, p))({
          ldj: [' || ', 3], lcj: [' && ', 4], bdj: [' | ', 5],
          xor: [' ^ ', 6], bcj: [' & ', 7], ceq: [' == ', 8],
          cqq: [' === ', 8], cne: [' != ', 8], cnn: [' !== ', 8],
          clt: [' < ', 9], cle: [' <= ', 9], cgt: [' > ', 9],
          cge: [' >= ', 9], shl: [' << ', 10], shr: [' >> ', 10],
          sar: [' >>> ', 10] }),
        ...omap(([x, p]) => assoc_bin_op(x, p))({
          add: [' + ', 11], sub: [' - ', 11], mul: [' * ', 12],
          div: [' / ', 12], mod: [' % ', 12], exp: [' ** ', 13] }),
        ...omap((x) => prefix_unop(x, 14))({
          pri: '++', prd: '--', pos: '+',
          neg: '-', not: '!', cmp: '~' }),
        ...omap((x) => postfix_unop(x, 15))({
          poi: '++', pod: '--' }),
        app: (x, ...y) => `${x(f(9))}(${commas(splat(y))})`,
        idx: (x, y) => `${x(f(9))}[${y(f(-1))}]`,
        ref: id,
        lst: (...x) => `[${commas(splat(x))}]`,
        str: literal,
        num: literal,
        bol: literal }) }
    const commas = dim('join')(', ')
    const splat = dim('map')(([splat, yi]) =>
      `${!splat ? '' : '...'}${yi(f(-1))}`)
    const rest = (y, z) => !y ? '' :
      `${z.length === 0 ? '' : ', '}...${y}`
    return f(-1) })()

    const implement = (() => {
      const globals = {
        map, Array, Math, }
      const splats = (f, a) => (...x) => f(...x)(...[].concat(...a.map(([splat, ae]) => splat ? [...ae(...x)] : [ae(...x)])))
      const f = (depth, locals) => {
        const g = context => {
          const invalid_for = (...x) => {
            if (x.some(xe => xe === context)) {
              throw new SyntaxError(`invalid operand for ${context}`) } }
          const unop = op => e => {
            invalid_for('assignment', 'call')
            const ep = e(general)
            return (...x) => op(ep(...x)) }
          const unop_assign_pre = op => e => {
            invalid_for('call')
            const ep = e(assignment)
            const format = context === 'assignment' ? id : il
            return (...x) => {
              const p = ep(...x)
              op(...p)
              return format(...p) } }
          const unop_assign_post = op => e => {
            invalid_for('assignment', 'call')
            const ep = e(assignment)
            return (...x) => op(...ep(...x)) }
          const binop = op => (...e) => {
            invalid_for('assignment', 'call')
            const ep = e.map(di(general))
            return (...x) => op(...ep.map(cdi(...x))) }
          const binop_assign = op => (a, b) => {
            invalid_for('assignment', 'call')
            const ap = a(assignment)
            const bp = b(general)
            const format = context === 'assignment' ? id : il
            return (...x) => {
              const [l, i, b] = [...ap(...x), () => bp(...x)]
              op(l, i, b)
              return format([l, i]) } }
          const literal = c => {
            invalid_for('assignment', 'call')
            return cs(c) }
          const format = context === 'assignment' ? id : il
          return tbl(Object.assign({}, ...map(([x, o]) => omap(x)(o))(
            [binop_assign, {
              ass: (l, i, b) => l[i] = b(), ada: (l, i, b) => l[i] += b(),
              sua: (l, i, b) => l[i] -= b(), mua: (l, i, b) => l[i] *= b(),
              exa: (l, i, b) => l[i] **= b(), dia: (l, i, b) => l[i] /= b(),
              rea: (l, i, b) => l[i] %= b(), lsa: (l, i, b) => l[i] <<= b(),
              rsa: (l, i, b) => l[i] >>= b(), raa: (l, i, b) => l[i] >>>= b(),
              bca: (l, i, b) => l[i] &= b(), xoa: (l, i, b) => l[i] ^= b(),
              bda: (l, i, b) => l[i] |= b(), lca: (l, i, b) => l[i] &&= b(),
              lda: (l, i, b) => l[i] ||= b() }],
            [binop, {
              seq: (a, b) => (a(), b()),
              ldj: (a, b) => a() || b(), lcj: (a, b) => a() && b(),
              bdj: (a, b) => a() | b(), xor: (a, b) => a() ^ b(),
              bcj: (a, b) => a() & b(), ceq: (a, b) => a() == b(),
              cqq: (a, b) => a() === b(), cne: (a, b) => a() != b(),
              cnn: (a, b) => a() !== b(), clt: (a, b) => a() < b(),
              cle: (a, b) => a() <= b(), cgt: (a, b) => a() > b(),
              cge: (a, b) => a() >= b(), shl: (a, b) => a() << b(),
              shr: (a, b) => a() >> b(), sar: (a, b) => a() >>> b(),
              add: (a, b) => a() + b(), sub: (a, b) => a() - b(),
              mul: (a, b) => a() * b(), div: (a, b) => a() / b(),
              mod: (a, b) => a() % b(), exp: (a, b) => a() ** b() }],
            [unop_assign_pre, {
              pri: (l, i) => ++l[i], prd: (l, i) => --l[i] }],
            [unop_assign_post, {
              poi: (l, i) => l[i]++, pod: (l, i) => l[i]-- }],
            [unop, {
              pos: a => +a, neg: a => -a,
              not: a => !a, cmp: a => ~a }],
            [cs(literal), {
              str: 0, num: 0, bol: 0 }],
            [id, {
              abs: (x, y, ...z) => {
                invalid_for('assignment')
                const ifrest = y === undefined ? cs([]) : li
                const l2 = {
                  ...locals,
                  ...Object.fromEntries(
                    [...z, ...ifrest(y)].map((e, i) => [e, i + depth])) }
                const depth2 = depth + z.length + sum(...ifrest(1))
                const xp = x(f(depth2, l2).general)
                return (...x) => (...a) =>
                  xp(...x, ...a.slice(0, z.length).map(li), ...ifrest(a.slice(z.length)).map(li)) },
              app: (d, ...o) => {
                invalid_for('assignment')
                return splats(d(call), mapr(di(general))(...o)) },
              idx: (h, a) => {
                const hp = h(general)
                const ap = a(general)
                return (...x) => format([hp(...x), ap(...x)]) },
              ref: i => {
                if (i in locals) {
                  const lu = locals[i]
                  return (...x) => format([x[lu], 0]) }
                if (i in globals) {
                  invalid_for('assignment')
                  return cs(globals[i]) }
                throw new ReferenceError(`${i} is not defined`) },
              lst: (...e) => {
                invalid_for('assignment')
                return splats(cs(li), mapr(di(general))(...e)) } } ]))) }
        const general = g('general')
        const assignment = g('assignment')
        const call = g('call')
        return { general, assignment, call } }
      return f })()

    // const remove = o => (...is) => {
    // 	for (const i of is) {
    // 		delete o[i] }
    // 	return o }

    // const discos = (...z) => {
    // 	const g = tbl({
    // 		abs: (a, b, ...c) => remove(a(discos))(...c, ...(b === undefined ? [] : [b])),
    // 		ref: () => ({}),
    // 		app: () => ({}),
    // 		lst: () => ({}),
    // 		neg: () => ({}),
    // 		add: () => ({}),
    // 		sub: () => ({}),
    // 		mul: () => ({}),
    // 		div: (a, b) => ({ ...a(g), ...b(discos(...z, 0)) }),
    // 		mod: () => ({}),
    // 		str: () => ({}),
    // 		num: () => ({}),
    // 		bol: () => ({}) })
    // 	return g }

    const read = (() => {
      return s => {
        const err = x => { throw new SyntaxError(`${x}\n-----\n${s}`) }
        const eof = () => s.length === 0

        const tk = {
          ws: /^((\s|\/\/[^\n]*|\/\*([^\*]|\*[^\/])*\*\/)*)/,
          tt: /^(true)/, cd: /^(false)/, cm: /^(,)/,
          dt: /^(\.)[^\.]/, el: /^(\.\.\.)/,
          lp: /^(\()/, rp: /^(\))/,
          lb: /^(\[)/, rb: /^(\])/,
          lc: /^(\{)/, rc: /^(\})/,
          dq: /^(")/, eqq: /^(=)[^=>]/, plq: /^(\+=)/,
          mnq: /^(-=)/, asq: /^(\*=)/, exq: /^(\*\*=)/,
          soq: /^(\/=)/, pcq: /^(%=)/, lsq: /^(<<=)/,
          rsq: /^(>>=)/, raq: /^(>>>=)/, amq: /^(&=)/,
          xoq: /^(\^=)/, ppq: /^(\|=)/, cjq: /^(&&=)/,
          djq: /^(||=)/, dj: /^(\|\|)[^=]/, cj: /^(&&)[^=]/,
          pp: /^(\|)[^\|=]/, cr: /^(\^)[^=]/,
          am: /^(&)[^&=]/, ye: /^(==)[^=]/,
          yy: /^(===)/, ne: /^(!=)[^=]/, nn: /^(!==)/,
          lt: /^(<)[^=<]/, le: /^(<=)/, gt: /^(>)[^=>]/,
          ge: /^(>=)/, ls: /^(<<)[^=]/, rs: /^(>>)[^>]/,
          ra: /^(>>>)/, pl: /^(\+)[^=+]/, mn: /^(-)[^=-]/,
          ex: /^(!)[^=]/, td: /^(~)/, as: /^(\*)[^=\*]/,
          ep: /^(\*\*)[^=]/, ic: /^(\+\+)/,
          dc: /^(\-\-)/, pc: /^(%)[^=]/, so: /^(\/)[^=\*]/,
          ar: /^(=>)/, id: /^([^\W\d][\w]*)/,
          sb: /^(([^"\\]|\\.)*)/,
          nm: /^([+-]?(?:\d+(?:\.\d*)?|\.\d*)(?:[eE][+-]?\d+)?)/ }

        for (const i in tk) {
          const t = tk[i]
          tk[i] = () => {
            const ws = (m => m && m[1])(s.match(t))
            return ws && (s = s.slice(ws.length), ws) } }

        const expect = (s, t) => {
          const i = tk[t]()
          if (!i) {
            err(`expected ${s}`) }
          return i }

        const right_infixes = [
          [['cm', nd('seq')]],
          [
            ['eqq', nd('ass')], ['plq', nd('ada')], ['mnq', nd('sua')],
            ['asq', nd('mua')], ['soq', nd('dia')], ['exq', nd('exa')],
            ['pcq', nd('rea')], ['lsq', nd('lsa')], ['rsq', nd('rsa')],
            ['raq', nd('raa')], ['amq', nd('bca')], ['xoq', nd('xoa')],
            ['ppq', nd('bda')], ['cjq', nd('lca')], ['djq', nd('lda')]]]

        const left_infixes = [
          [['dj', nd('ldj')]],
          [['cj', nd('lcj')]],
          [['pp', nd('bdj')]],
          [['cr', nd('xor')]],
          [['am', nd('bcj')]],
          [
            ['ye', nd('ceq')], ['yy', nd('cqq')],
            ['ne', nd('cne')], ['nn', nd('cnn')]],
          [
            ['lt', nd('clt')], ['le', nd('cle')],
            ['gt', nd('cgt')], ['ge', nd('cge')]],
          [['ls', nd('shl')], ['rs', nd('shr')], ['ra', nd('sar')]],
          [['pl', nd('add')], ['mn', nd('sub')]],
          [['as', nd('mul')], ['so', nd('div')], ['pc', nd('mod')]],
          [['ep', nd('exp')]]]

        const prefixes = [
          ['ic', nd('pri')], ['dc', nd('prd')], ['pl', nd('pos')],
          ['mn', nd('neg')], ['ex', nd('not')], ['td', nd('cmp')]]

        const postfixes = [
          ['ic', nd('poi')], ['dc', nd('pod')],
          ['lp', lhs => {
            tk.ws()
            if (tk.rp()) {
              return nd('app')(lhs) }
            else {
              const rhss = []
              for (;;) {
                tk.ws()
                rhss.push([!!tk.el(), infix_expression()])
                tk.ws()
                if (tk.rp()) {
                  break }
                expect(',', 'cm') }
              return nd('app')(lhs, ...rhss) } }],
          ['lb', lhs => {
            const e = nd('idx')(lhs, infix_expression())
            tk.ws()
            expect(']', 'rb')
            return e }]]

        const primaries = [
          ['tt', () => nd('bol')(true)],
          ['cd', () => nd('bol')(false)],
          ['lp', () => {
            let sp = s
            let depth = 0
            for(;;) {
              if (tk.lp()) {
                depth++; }
              else if (tk.rp()) {
                if (depth === 0) {
                  break }
                depth--; }
              else if (eof()) {
                err('unclosed )') }
              else {
                s = s.slice(1) } }
            tk.ws()
            const is_lambda = !!tk.ar()
            s = sp
            if (is_lambda) {
              const destructures = closer => {
              if (closer()) {
                tk.ws()
                tk.ar()
                return [] }
              const is = []
              for (;;) {
                tk.ws()
                if (tk.lb()) {
                  return destructure_list() }
                if (tk.lc()) {
                  return destructure_object() }
                const rest = !!tk.el()
                if (rest) {
                  tk.ws()
                  if (tk.lb()) {
                    const dl = destructure_list()
                    tk.ws()
                    expect(')', 'rp')
                    return [dl, ...is] }
                  const i = expect('identifier', 'id')
                  tk.ws()
                  expect(')', 'rp')
                  return [i, ...is] }
                tk.ws()
                is.push(expect('identifier', 'id'))
                tk.ws()
                if (closer()) {
                  return [undefined, ...is] }
                expect(',', 'cm') } }
              const ds = destructures(tk.rp)
              tk.ws()
              tk.ar()
              return nd('abs')(infix_expression(), ...ds) }
            const e = comma_expression();
            expect(')', 'rp')
            return e }],
          ['lb', () => {
            tk.ws()
            if (tk.rb()) {
              return nd('lst')() }
            const elems = []
            for (;;) {
              tk.ws()
              elems.push([!!tk.el(), infix_expression()])
              tk.ws()
              if (tk.rb()) {
                break }
              expect(',', 'cm') }
            return nd('lst')(...elems) }],
          ['dq', () => {
            const val = tk.sb()
            expect('"', 'dq')
            return nd('str')(JSON.parse(`"${val}"`)) }],
          ['id', i => {
            tk.ws()
            if (tk.ar()) {
              return nd('abs')(infix_expression(), undefined, i) }
            return nd('ref')(i) }],
          ['nm', i => nd('num')(Number.parseFloat(i))]]

        const convert_tokens = parsers => {
          for (const i in parsers) {
            const [token, parse] = parsers[i]
            parsers[i] = [tk[token], parse] } }

        const primary_prefix_expression = (() => {
          convert_tokens(prefixes)
          convert_tokens(primaries)
          return () => {
            tk.ws()
            for (const [token, read] of primaries) {
              const i = token()
              if (i) {
                return read(i); } }
            for (const [token, node] of prefixes) {
              if (token()) {
                return node(postfix_expression()) } }
            err('expected expression') } })()

        const postfix_expression = (() => {
          convert_tokens(postfixes)
          return () => {
            const tryall = () => {
              tk.ws()
              for (const [token, read] of postfixes){
                if (token()) {
                  lhs = read(lhs)
                  return true } }
              return false }
            let lhs = primary_prefix_expression()
            for (;tryall(););
            return lhs } })()

        const right_infix_expression = (then, ...nodes) => {
          convert_tokens(nodes)
          return () => {
            const tryall = () => {
              tk.ws()
              for (const [token, node] of nodes) {
                if (token()) {
                  const rhs = then()
                  tk.ws()
                  e.push([node, rhs])
                  return true } }
              return false }
            const e = []
            const lhs = then()
            for (;tryall(););
            if (e.length === 0) {
              return lhs }
            let [node, rhs] = e[e.length - 1]
            for (let i = e.length - 1; i--;) {
              const [nodep, rhsp] = e[i]
              rhs = node(rhsp, rhs)
              node = nodep }
            return node(lhs, rhs) } }

        const left_infix_expression = (then, ...nodes) => {
          convert_tokens(nodes)
          return () => {
            const tryall = () => {
              tk.ws()
              for (const [token, node] of nodes) {
                if (token()) {
                  const rhs = then()
                  tk.ws()
                  lhs = node(lhs, rhs)
                  return true } }
              return false }
            let lhs = then()
            for (;tryall(););
            return lhs } }

        let prev = postfix_expression
        for (let i = left_infixes.length; i--;) {
          prev = left_infix_expression(prev, ...left_infixes[i]) }
        const infix_expression = right_infix_expression(prev, ...right_infixes[1])
        const comma_expression = right_infix_expression(infix_expression, ...right_infixes[0])
        const e = infix_expression()
        if (!eof()) {
          err('expected eof') }
        return e } })()

    return { read, pretty, implement }
  })()

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

    const f_impl = f(implement(0, {}).general)()

    if (typeof f_impl !== 'function') {
      throw new TypeError('the term is not a function') }
    // const f_disco = f(discos())

    // output.appendChild(t(`[${Object.keys(f_disco).map(i => `${i}: ${f_disco[i]}`).join(', ')}]`))

    for (let i = 0; i < points.length; i++) {
      const x = xmin + i * (xmax - xmin) / segment_count
      let y = f_impl(x)
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

    const doc = svg({ width, height })
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
      src: url('https://ojuea.us/cmuntt.ttf') }`,

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
  `(a => a(a))((...x) => f => f(...x))(let =>

let(Math["floor"])(floor =>

x =>
  let(
    let(0, 1)((i, c) =>
    () =>
      let(c * x ** i)(r =>
      (i++, c /= i, r))))(g =>
  let(Array(floor(0.75 * (x + 4) + 1)))(a =>
  map(g)(...a)))))`

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

  const update = () => {
    const pfp = x => parseFloat(x.innerHTML)
    const debug = (f, g) => {
      const v = f()
      g(...v) }
    const ndebug = (f, g) => {
      let v
      try {
        v = f() }
      catch (e) {
        output.append(t(e.toString()))
        return }
      g(...v) }

    output.innerHTML = ''
    ;(1 ? ndebug : debug)(
      () => {
        const f_tree = read(formula.textContent)
        // output.appendChild(html_div({})(t(f_tree(pretty))))
        const plot = drawplot(`f = ${f_tree(pretty)}`, 'x', 'f(x)', f_tree,
          pfp(segments),
          ...[xmin, xmax, ymin, ymax].map(pfp), pfp(diagonal))
        return [plot] },
      plot => {
        plot.id = 'plot'
        output.appendChild(div_center(plot)) }) }

  const textboxes = [formula, xmin, xmax, ymin, ymax, segments, diagonal]

  for (const e of textboxes) {
    e.toggleAttribute('contenteditable')
    e.setAttribute('spellcheck', 'false')
    e.addEventListener('input', update) }

  update()

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

})()