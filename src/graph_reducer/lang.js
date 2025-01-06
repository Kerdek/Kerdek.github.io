import { make, sym, tbl, maken, tbln } from './graph.js';
const narrow = (x) => x;
const token = (s) => {
    const take = t => () => (ws => ws == undefined ? null : (s[0] = s[0].slice(ws[0].length), ws[0]))(s[0].match(t));
    return {
        ws: take(/^(\s|#([^#\\]|\\.)*#?)*/),
        lm: take(/^(\\|λ)/), ex: take(/^∃/),
        eq: take(/^=/),
        ee: take(/^==/), ne: take(/^!=/),
        ge: take(/^>=/), le: take(/^<=/), gt: take(/^>/), lt: take(/^</),
        lc: take(/^\{/), rc: take(/^\}/), it: take(/^\$\{/),
        pl: take(/^\+/), hy: take(/^-/), as: take(/^\*/), so: take(/^\//), pc: take(/^%/),
        un: take(/^\//), dt: take(/^\./),
        cm: take(/^,/), ds: take(/^\$/), sc: take(/^\;/), cn: take(/^\:/), lp: take(/^\(/),
        rp: take(/^\)/), lb: take(/^\[/), rb: take(/^\]/), sq: take(/^'/), gq: take(/^`/),
        dq: take(/^"/),
        ib: take(/^([^`\$\\]|\$[^\{`]|\\.)*/),
        id: take(/^[^\W\d](-\w)?(\w(-\w)?)*/), sb: take(/^([^"\\]|\\.)*/),
        nm: take(/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?/)
    };
};
const null_tokens = token(['']);
const list2cns = l => {
    let e = make(null, 'fls');
    while (l.length != 0) {
        e = make(null, 'cns', l[l.length - 1], e);
        l.pop();
    }
    return e;
};
const read_c = tokens => {
    const prefix_primary = () => {
        tk.ws();
        for (const [token, p] of primaries) {
            const c = tk[token]();
            if (c)
                return p(c);
        }
        return undefined;
    };
    const application = () => {
        let lhs = prefix_primary();
        for (;;) {
            if (!lhs)
                return null;
            const rhs = prefix_primary();
            if (rhs === undefined)
                return lhs;
            if (!rhs)
                return null;
            lhs = make(null, 'app', lhs, rhs);
        }
    };
    const binop_right = (next, ...tks) => () => {
        const l = next();
        if (!l)
            return null;
        let lhs = l;
        const rhss = [];
        const tryall = () => {
            for (const [token, kind] of tks) {
                if (tk[token]()) {
                    const rhs = next();
                    if (!rhs)
                        return null;
                    rhss.push([lhs, kind]);
                    lhs = rhs;
                    return false;
                }
            }
            return true;
        };
        for (;;) {
            if (tryall())
                break;
        }
        for (;;) {
            const l = rhss.pop();
            if (l === undefined) {
                return lhs;
            }
            const [le, lk] = l;
            lhs = make(null, lk, le, lhs);
        }
    };
    const binop_left = (next, ...tks) => () => {
        const l = next();
        if (!l)
            return null;
        let lhs = l;
        const tryall = () => {
            for (const [token, kind] of tks) {
                if (tk[token]()) {
                    const rhs = next();
                    if (!rhs)
                        return null;
                    lhs = make(null, kind, lhs, rhs);
                    return false;
                }
            }
            return true;
        };
        for (;;) {
            const x = tryall();
            if (x == null)
                return null;
            if (x) {
                return lhs;
            }
        }
    };
    const s = [''];
    const tk = token(s);
    const [ops, primaries] = tokens(tk, () => expression());
    let expression = application;
    for (const [parser, ...tks] of ops) {
        expression = (parser ? binop_right : binop_left)(expression, ...tks);
    }
    return text => {
        s[0] = text;
        const e = expression();
        if (s[0][0])
            return null;
        else
            return e;
    };
};
export const read = read_c((tk, expression) => {
    const universal = () => {
        const readu = () => (tk.ws(),
            tk.dt() ? expression() :
                (id => !id ? null : (e => !e ? null : make(null, 'uni', sym(id), e))(readu()))(tk.id()));
        return readu();
    };
    const existential = () => {
        tk.ws();
        const id = tk.id();
        if (!id)
            return null;
        tk.ws();
        if (!tk.eq())
            return null;
        const d = expression();
        if (!d)
            return null;
        if (!tk.dt())
            return null;
        const b = expression();
        if (!b)
            return null;
        return make(null, 'ext', make(null, 'nym', sym(id), d), b);
    };
    const parenthetical = () => {
        const e = expression();
        if (!e || !tk.rp())
            return null;
        return e;
    };
    const list = () => {
        const elems = [];
        for (;;) {
            if (tk.rb())
                return list2cns(elems);
            const e = expression();
            if (!e)
                return null;
            elems.push(e);
            if (tk.rb())
                return list2cns(elems);
            if (!tk.cm())
                return null;
        }
    };
    const interpolation = () => {
        if (tk.gq()) {
            return make(null, 'fls');
        }
        const format = x => JSON.parse(`"${x.replaceAll(/\\\`/g, '`')}"`);
        const a = tk.ib();
        if (a == null)
            return null;
        if (tk.it()) {
            const e = expression();
            if (!e || !tk.rc())
                return null;
            let parts = [...a ? [make(null, 'str', format(a))] : [], e];
            for (;;) {
                if (tk.gq()) {
                    return make(null, 'itp', list2cns(parts));
                }
                const b = tk.ib();
                if (b) {
                    parts.push(make(null, 'str', format(b)));
                }
                else if (tk.it()) {
                    const e = expression();
                    if (!e || !tk.rc())
                        return null;
                    parts.push(e);
                }
                else if (!tk.gq())
                    return null;
            }
        }
        if (!tk.gq())
            return null;
        return make(null, 'cns', make(null, 'str', format(a)), make(null, 'fls'));
    };
    const quotation = () => (e => e && make(null, 'qot', e))(expression());
    const string = () => (val => tk.dq() ? make(null, 'str', JSON.parse(`"${val}"`)) : null)(tk.sb());
    const predefined = narrow({
        true: 'tru',
        false: 'fls',
        const: 'cst',
        rec: 'rec'
    });
    const identifier = (c) => {
        if (c === 'true' || c === 'false' || c === 'const' || c === 'rec') {
            const l = predefined[c];
            return make(null, l);
        }
        return make(null, 'ref', sym(c));
    };
    const number = c => make(null, 'num', Number.parseFloat(c));
    return [[
            [false, ['as', 'mul'], ['so', 'div'], ['pc', 'mod']],
            [false, ['pl', 'add'], ['hy', 'sub']],
            [true, ['ge', 'cge'], ['le', 'cle'], ['gt', 'cgt'], ['lt', 'clt']],
            [true, ['ee', 'ceq'], ['ne', 'cne']],
            [true, ['cn', 'cns']],
            [true, ['ds', 'app']]
        ], [
            ['lm', universal],
            ['ex', existential],
            ['lp', parenthetical],
            ['lb', list],
            ['gq', interpolation],
            ['sq', quotation],
            ['dq', string],
            ['id', identifier],
            ['nm', number]
        ]];
});
const never = e => { throw new Error(`never happened on kind ${e.kind}`); };
export const highlight_html = text => {
    let ranges = [];
    let offset = 0;
    const cd = (m, n) => {
        const old = offset;
        offset += n.length;
        ranges.push([old, offset, m]);
    };
    const p = [];
    const s = [text];
    const tks = token(s);
    let i = 0;
    const f = () => {
        const g = (cls) => (tk) => () => {
            const c = tks[tk]();
            if (c != null) {
                if (c) {
                    p.push(`<span class="hl${cls}">${c}</span>`);
                }
                cd(tk, c);
                return true;
            }
            return false;
        };
        const tokens = (gk, first, ...rest) => () => first ? gk(first)() || tokens(gk, ...rest)() : false;
        let mode = 0;
        for (;;) {
            if (!s[0][0])
                return;
            if (mode === 0) {
                let c = tks.ws();
                if (c) {
                    p.push(`<span class="hlws">${c}</span>`);
                    cd('ws', c);
                    continue;
                }
                if (tokens(g('const'), 'nm')() ||
                    tokens(g('quant'), 'ex', 'sq', 'lm')() ||
                    tokens(g('punct'), 'ee', 'eq', 'ne', 'ge', 'le', 'gt', 'lt', 'pl', 'hy', 'as', 'so', 'pc', 'ds', 'sc', 'cn', 'dt', 'cm')()) {
                    continue;
                }
                c = tks.id();
                if (c) {
                    const cls = c == 'true' || c == 'false' || c == 'const' || c == 'rec' ? 'key' : 'id';
                    p.push(`<span class="hl${cls}">${c}</span>`);
                    cd('id', c);
                    continue;
                }
                if (g('punct')('rc')()) {
                    g('const')('ib')();
                    mode = 1;
                    continue;
                }
                if (g(`parn${(i) % 6}`)('lp')()) {
                    i++;
                    continue;
                }
                if (g(`parn${(i - 1) % 6}`)('rp')()) {
                    i--;
                    continue;
                }
                if (g(`parn${(i) % 6}`)('lb')()) {
                    i++;
                    continue;
                }
                if (g(`parn${(i - 1) % 6}`)('rb')()) {
                    i--;
                    continue;
                }
                if (g('quant')('gq')()) {
                    g('const')('ib')();
                    mode = 1;
                    continue;
                }
                if (g('quant')('dq')()) {
                    g('const')('sb')();
                    g('quant')('dq')();
                    continue;
                }
            }
            else if (mode === 1) {
                if (g('quant')('gq')() ||
                    g('punct')('it')()) {
                    mode = 0;
                    continue;
                }
            }
            p.push(s[0][0]);
            s[0] = s[0].slice(1);
        }
    };
    const bsearch = x => {
        if (ranges.length == 0)
            return [undefined, undefined];
        let start = 0, end = ranges.length - 1;
        while (start <= end) {
            let mid = Math.floor((start + end) / 2);
            const r = ranges[mid];
            const [ra, rb] = r;
            if (ra < x && rb > x) {
                return [r, r];
            }
            else if (rb < x) {
                start = mid + 1;
            }
            else if (rb == x) {
                return [r, ranges[mid + 1]];
            }
            else if (ra > x) {
                end = mid - 1;
            }
            else if (ra == x) {
                return [ranges[mid - 1], r];
            }
            else
                return [undefined, undefined];
        }
        return [undefined, undefined];
    };
    f();
    return [p.join(''), bsearch];
};
export const pretty = (() => {
    const ident = s => s;
    const parens = s => `(${s})`;
    const passthru = e => fr(e.body);
    const exact = x => () => () => x;
    const literal = e => () => JSON.stringify(e.val);
    const quantifier = op => e => (_pr, rm) => (rm ? ident : parens)(`${op}${fr(e.body)(0, true)}`);
    const binop = (p, op, right) => e => (pr, rm) => (pr > p ? parens : ident)(`${pretty(e.lhs)(right ? p + 1 : p, false)}${op}${pretty(e.rhs)(right ? p : p + 1, rm || pr > p)}`);
    const fr = tbl({
        uni: e => {
            let qt = `λ${e.sym.id}`;
            let b = e;
            for (;;) {
                if (b.body.kind === 'uni') {
                    qt += ` ${b.body.sym.id}`;
                    b = b.body;
                }
                else if (b.body.kind === 'mem' || b.body.kind === 'ext') {
                    b = b.body;
                }
                else
                    break;
            }
            return quantifier(`${qt}.`)(b);
        },
        rec: exact('rec'),
        nym: e => () => e.sym.id,
        ref: e => () => e.sym.id,
        mem: passthru,
        ext: passthru,
        thk: quantifier(';'),
        jst: quantifier('='),
        qot: quantifier("'"),
        app: binop(10, ' ', false),
        cns: binop(5, ' : ', true),
        ceq: binop(3, ' == ', true),
        cne: binop(3, ' != ', true),
        cgt: binop(4, ' > ', true),
        clt: binop(4, ' < ', true),
        cge: binop(4, ' >= ', true),
        cle: binop(4, ' <= ', true),
        add: binop(6, ' + ', false),
        sub: binop(6, ' - ', false),
        mul: binop(7, ' * ', false),
        div: binop(7, ' / ', false),
        mod: binop(7, ' % ', false),
        itp: exact("``"),
        fmt: exact("${}"),
        tru: exact('true'),
        fls: exact('false'),
        cst: exact(`const`),
        str: literal,
        num: literal
    });
    return fr;
})();
export const to_digraph = async (t, v) => {
    const walk_name_nodes = e => {
        let t = nodes_token.get(e);
        if (t !== undefined)
            return;
        t = counter++;
        nodes_token.set(e, t);
        walk_graph_nodes(e.body);
        out.push(`${t}[shape=diamond,label="${e.sym.id}",tooltip=""]`);
        out.push(`${t}->${nodes_token.get(e.body)}`);
    };
    const walk_graph_nodes = e => {
        let t = nodes_token.get(e);
        if (t !== undefined)
            return;
        t = counter++;
        nodes_token.set(e, t);
        e.kind === 'ext' ?
            (walk_name_nodes(e.name), walk_graph_nodes(e.body)) :
            e.kind === 'mem' || e.kind === 'nym' || e.kind === 'uni' || e.kind === 'qot' ||
                e.kind === 'jst' || e.kind === 'thk' || e.kind === 'fmt' || e.kind === 'itp' ?
                walk_graph_nodes(e.body) :
                e.kind === 'cns' ?
                    (walk_graph_nodes(e.lhs), walk_graph_nodes(e.rhs)) :
                    e.kind === 'app' || e.kind === 'ceq' || e.kind === 'cne' || e.kind === 'cgt' ||
                        e.kind === 'clt' || e.kind === 'cge' || e.kind === 'cle' || e.kind === 'add' ||
                        e.kind === 'sub' || e.kind === 'mul' || e.kind === 'div' || e.kind === 'mod' ?
                        (walk_graph_nodes(e.lhs), walk_graph_nodes(e.rhs)) :
                        e.kind === 'cst' || e.kind === 'ref' || e.kind === 'str' || e.kind === 'num' ||
                            e.kind === 'fls' || e.kind === 'tru' || e.kind === 'rec' ?
                            void 0 :
                            never(e);
        out.push(`${t}[${e.kind === 'mem' ||
            e.kind === 'ext' ?
            'fixedsize=true,width=0.15,height=0.15,style=filled,' :
            e.kind === 'thk' || e.kind === 'app' || e.kind === 'cns' ||
                e.kind === 'ceq' || e.kind === 'cne' || e.kind === 'cgt' ||
                e.kind === 'clt' || e.kind === 'cge' || e.kind === 'cle' || e.kind === 'qot' ||
                e.kind === 'add' || e.kind === 'sub' || e.kind === 'mul' || e.kind === 'div' || e.kind === 'mod' ||
                e.kind === 'itp' || e.kind === 'fmt' ?
                'fixedsize=true,width=0.5,height=0.5,' :
                e.kind === 'jst' || e.kind === 'nym' || e.kind === 'uni' || e.kind === 'rec' || e.kind === 'cst' || e.kind === 'ref' || e.kind === 'str' ||
                    e.kind === 'num' || e.kind === 'fls' || e.kind === 'tru' ? '' :
                    never(e)}shape=${e.kind === 'nym' ? 'diamond' :
            e.kind === 'ext' ? 'box' :
                e.kind === 'uni' ? 'invtriangle' :
                    e.kind === 'thk' || e.kind === 'mem' || e.kind === 'app' ||
                        e.kind === 'cns' || e.kind === 'ceq' || e.kind === 'cne' || e.kind === 'cgt' ||
                        e.kind === 'clt' || e.kind === 'cge' || e.kind === 'cle' || e.kind === 'qot' ||
                        e.kind === 'add' || e.kind === 'sub' || e.kind === 'mul' ||
                        e.kind === 'div' || e.kind === 'mod' || e.kind === 'itp' ||
                        e.kind === 'fmt' ? 'circle' :
                        e.kind === 'cst' || e.kind === 'ref' || e.kind === 'str' || e.kind === 'num' ||
                            e.kind === 'jst' || e.kind === 'fls' || e.kind === 'tru' || e.kind === 'rec' ? 'plaintext' :
                            never(e)},label="${e.kind === 'thk' ? ';' :
            e.kind === 'mem' ||
                e.kind === 'ext' ||
                e.kind === 'app' ? ' ' :
                e.kind === 'nym' ? e.sym.id :
                    e.kind === 'cst' ? 'const' :
                        e.kind === 'jst' ? 'const' :
                            e.kind === 'rec' ? `rec` :
                                e.kind === 'uni' ? e.sym.id :
                                    e.kind === 'cns' ? ':' :
                                        e.kind === 'ceq' ? '==' :
                                            e.kind === 'cne' ? '!=' :
                                                e.kind === 'cgt' ? '>' :
                                                    e.kind === 'clt' ? '<' :
                                                        e.kind === 'cge' ? '>=' :
                                                            e.kind === 'cle' ? '<=' :
                                                                e.kind === 'add' ? '+' :
                                                                    e.kind === 'sub' ? '-' :
                                                                        e.kind === 'mul' ? '*' :
                                                                            e.kind === 'div' ? '/' :
                                                                                e.kind === 'mod' ? '%' :
                                                                                    e.kind === 'itp' ? '``' :
                                                                                        e.kind === 'fmt' ? '\$' :
                                                                                            e.kind === 'qot' ? '\'' :
                                                                                                e.kind === 'ref' ? e.sym.id :
                                                                                                    e.kind === 'str' ? JSON.stringify(JSON.stringify(e.val)).slice(1, -1) :
                                                                                                        e.kind === 'num' ? `${e.val}` :
                                                                                                            e.kind === 'fls' ? 'false' :
                                                                                                                e.kind === 'tru' ? 'true' :
                                                                                                                    never(e)}",tooltip=""]`);
        e.kind === 'ext' ? out.push(`${t}->${nodes_token.get(e.body)};${nodes_token.get(e.name)}->${t}[style=dotted,penwidth=4]`) :
            e.kind === 'app' || e.kind === 'cns' || e.kind === 'ceq' || e.kind === 'cne' ||
                e.kind === 'cgt' || e.kind === 'clt' || e.kind === 'cge' || e.kind === 'cle' ||
                e.kind === 'add' || e.kind === 'sub' || e.kind === 'mul' ||
                e.kind === 'div' || e.kind === 'mod' ? out.push(`${t}->${nodes_token.get(e.lhs)};${t}->${nodes_token.get(e.rhs)}[dir=back]`) :
                e.kind === 'thk' || e.kind === 'uni' || e.kind === 'itp' || e.kind === 'fmt' ||
                    e.kind === 'mem' || e.kind === 'nym' || e.kind === 'jst' ||
                    e.kind === 'qot' ? out.push(`${t}->${nodes_token.get(e.body)}`) :
                    e.kind === 'cst' || e.kind === 'ref' || e.kind === 'str' || e.kind === 'num' ||
                        e.kind === 'rec' || e.kind === 'fls' || e.kind === 'tru' ? void 0 :
                        never(e);
    };
    let counter = 0;
    let out = [];
    const nodes_token = new Map();
    for (const i in v) {
        const e = v[i];
        walk_graph_nodes(e);
        const t = counter++;
        out.push(`{rank=min;${t}[class="start",shape=diamond,label="${i}",tooltip=""]}`);
        out.push(`${t}->${nodes_token.get(e)}`);
    }
    const src = `digraph ${t}{nodesep=0.3;bgcolor="transparent";node[rankjustify=min];edge[arrowhead=none];${out.join(';')}}`;
    const viz = new Viz();
    const img = await viz.renderSVGElement(src);
    img.style.verticalAlign = "top";
    const rect = img.viewBox.baseVal;
    const strip_queue = [img];
    for (;;) {
        const e = strip_queue.shift();
        if (!e)
            break;
        e.removeAttribute('id');
        e.removeAttribute('fill');
        e.removeAttribute('stroke');
        e.removeAttribute('font-family');
        e.removeAttribute('font-size');
        e.removeAttribute('text-anchor');
        for (let i = 0; i < e.childNodes.length; i++) {
            const remove = () => e.removeChild(c);
            const c = e.childNodes[i];
            if (c.nodeType === 1) {
                if (c.nodeName === 'title') {
                    remove();
                }
                else {
                    strip_queue.unshift(c);
                }
            }
            else if (c.nodeType === 8) {
                remove();
            }
        }
    }
    img.setAttribute('width', `${rect.width * 0.7}px`);
    img.setAttribute('height', `${rect.height * 0.7}px`);
    return img;
};
const refcount = e => {
    const token = new Map();
    const walk_name_refcount = e => {
        let t = token.get(e);
        if (t !== undefined) {
            token.set(e, t ? t + 1 : 2);
            return;
        }
        token.set(e, 0);
        walk_graph_refcount(e.body);
    };
    const walk_graph_refcount = e => {
        let t = token.get(e);
        if (t !== undefined) {
            token.set(e, t ? t + 1 : 2);
            return;
        }
        token.set(e, 0);
        const unary = e => {
            walk_graph_refcount(e.body);
        };
        const binary = e => {
            walk_graph_refcount(e.lhs);
            walk_graph_refcount(e.rhs);
        };
        const nop = () => { };
        tbl({
            ext: e => (walk_name_refcount(e.name), walk_graph_refcount(e.body)),
            mem: unary, nym: unary, uni: unary, qot: unary,
            jst: unary, thk: unary, fmt: unary, itp: unary,
            cns: binary, app: binary, ceq: binary, cne: binary,
            cgt: binary, clt: binary, cge: binary, cle: binary,
            add: binary, sub: binary, mul: binary, div: binary, mod: binary,
            cst: nop, ref: nop, rec: nop,
            str: nop, num: nop,
            fls: nop, tru: nop
        })(e);
    };
    walk_graph_refcount(e);
    return token;
};
export const to_outline = e => {
    const ident = e => e;
    const parens = e => `(${e})`;
    const exact = s => () => () => s;
    const literal = e => () => JSON.stringify(e.val);
    const binop = (p, op, right) => e => ((l, r) => (pr, rm) => (pr > p ? parens : ident)(`${l(right ? p + 1 : p, false)}${op}${r(right ? p : p + 1, rm || pr > p)}`))(walk(e.lhs), walk(e.rhs));
    const table = tbl({
        thk: e => (b => (pr, _rm) => `${pr > -1 ? '(' : ''}${b(0, true)}; ...${pr > -1 ? ')' : ''}`)(walk(e.body)),
        mem: e => (b => (pr, rm) => `${b(pr, rm)}`)(walk(e.body)),
        nym: e => (b => (_pr, rm) => `${!rm ? '(' : ''}@${b(0, true)}${!rm ? ')' : ''}`)(walk(e.body)),
        ext: e => ((n, b) => (_pr, rm) => `${!rm ? '(' : ''}∃${n(0, true)}.${b(0, true)}${!rm ? ')' : ''}`)(walk_name(e.name), walk(e.body)),
        uni: e => (b => (_pr, rm) => `${!rm ? '(' : ''}λ${e.sym.id}.${b(0, true)}${!rm ? ')' : ''}`)(walk(e.body)),
        rec: exact('rec'),
        app: binop(10, ' ', false),
        jst: e => (b => (pr, rm) => `${pr > 10 ? '(' : ''}const ${b(11, rm)}${pr > 10 ? ')' : ''}`)(walk(e.body)),
        cns: binop(5, ' : ', true), ceq: binop(3, ' == ', true),
        cne: binop(3, ' != ', true), cgt: binop(4, ' > ', true),
        clt: binop(4, ' < ', true), cge: binop(4, ' >= ', true),
        cle: binop(4, ' <= ', true), add: binop(6, ' + ', false),
        sub: binop(6, ' - ', false), mul: binop(7, ' * ', false),
        div: binop(7, ' / ', false), mod: binop(7, ' % ', false),
        itp: e => (b => () => `\`${b(0, true)}\``)(walk(e.body)),
        fmt: e => (b => () => `\${${b(0, true)}}`)(walk(e.body)),
        qot: e => (b => (_pr, rm) => `${!rm ? '(' : ''}'${b(0, true)}${!rm ? ')' : ''}`)(walk(e.body)),
        ref: e => () => `${e.sym.id}`,
        str: literal, num: literal,
        cst: exact(`const`),
        fls: exact('false'),
        tru: exact('true')
    });
    const walk_name = e => {
        const t = refcount_token.get(e);
        if (t == 0) {
            const text = walk(e.body);
            return () => `${e.sym.id} = ${text(0, true)}`;
        }
        else {
            if (t == 1) {
                surrogate_token.set(e, counter++);
                queue.push(e);
            }
            refcount_token.set(e, t - 1);
            return () => `<${surrogate_token.get(e)}>`;
        }
    };
    const walk = e => {
        let t = refcount_token.get(e);
        if (t == 0) {
            return table(e);
        }
        else {
            if (t == 1) {
                surrogate_token.set(e, counter++);
                queue.push(e);
            }
            refcount_token.set(e, t - 1);
            return () => `<${surrogate_token.get(e)}>`;
        }
    };
    const refcount_token = refcount(e);
    let counter = 0;
    let queue = [];
    const surrogate_token = new Map();
    const head = walk(e);
    const tail = [];
    for (;;) {
        const e = queue.shift();
        if (e === undefined) {
            break;
        }
        tail.push(e.kind === 'nym' ? walk_name(e) : walk(e));
    }
    const out = [head(0, true) + '\n'];
    for (const i in tail) {
        out.push(tail[i](0, true));
    }
    return out;
};
export const jso_to_graph = (i, p, q) => {
    const nullary = e => make(null, e.kind);
    const unary = e => make(null, e.kind, walk_graph(e.body));
    const binary = e => make(null, e.kind, walk_graph(e.lhs), walk_graph(e.rhs));
    const table = tbln({
        thk: () => { throw 0; },
        ext: e => make(null, 'ext', walk_name(e.name), walk_graph(e.body)),
        nym: e => make(null, 'nym', sym(e.sym), walk_graph(e.body)),
        uni: e => make(null, 'uni', sym(e.sym), walk_graph(e.body)),
        rec: nullary,
        ref: e => make(null, 'ref', sym(e.sym)),
        str: e => make(null, e.kind, e.val),
        num: e => make(null, e.kind, e.val),
        mem: unary, jst: unary, itp: unary, fmt: unary,
        qot: unary,
        app: binary, cns: binary, ceq: binary, cne: binary,
        cgt: binary, clt: binary, cge: binary, cle: binary,
        add: binary, sub: binary, mul: binary, div: binary, mod: binary,
        cst: nullary, fls: nullary, tru: nullary
    });
    const walk_name = t => {
        let e = p[t];
        if (e === undefined) {
            const qt = q[t];
            e = make(null, 'nym', sym(qt.sym), walk_graph(qt.body));
            p[t] = e;
        }
        return e;
    };
    const walk_graph = t => {
        let e = p[t];
        if (e === undefined) {
            const qt = q[t];
            e = table(qt);
            p[t] = e;
        }
        return e;
    };
    return walk_graph(i);
};
export const graph_to_jso = (e, p, q) => {
    const nullary = e => maken(null, e.kind);
    const unary = e => maken(null, e.kind, walk_graph(e.body));
    const binary = e => maken(null, e.kind, walk_graph(e.lhs), walk_graph(e.rhs));
    const table = tbl({
        thk: () => { throw 0; },
        mem: e => maken(null, 'mem', walk_graph(e.body)),
        nym: e => maken(null, 'nym', e.sym.id, walk_graph(e.body)),
        ext: e => maken(null, 'ext', walk_name(e.name), walk_graph(e.body)),
        uni: e => maken(null, 'uni', e.sym.id, walk_graph(e.body)),
        rec: nullary,
        ref: e => maken(null, 'ref', e.sym.id),
        app: binary, cns: binary, ceq: binary, cne: binary,
        cgt: binary, clt: binary, cge: binary, cle: binary,
        add: binary, sub: binary, mul: binary, div: binary, mod: binary,
        jst: unary, itp: unary, fmt: unary, qot: unary,
        cst: nullary, fls: nullary, tru: nullary,
        str: e => e, num: e => e
    });
    const walk_name = e => {
        let t = p.get(e);
        if (t === undefined) {
            t = counter++;
            p.set(e, t);
            q[t] = maken(null, 'nym', e.sym.id, walk_graph(e.body));
        }
        return t;
    };
    const walk_graph = e => {
        let t = p.get(e);
        if (t === undefined) {
            t = counter++;
            p.set(e, t);
            q[t] = table(e);
        }
        return t;
    };
    let counter = q.length;
    return walk_graph(e);
};
//# sourceMappingURL=lang.js.map