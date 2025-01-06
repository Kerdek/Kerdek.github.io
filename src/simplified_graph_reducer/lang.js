import { make, tbl } from './graph.js';
const narrow = (x) => x;
const token = (s) => {
    const take = t => () => (ws => ws == undefined ? null : (s[0] = s[0].slice(ws[0].length), ws[0]))(s[0].match(t));
    return {
        ws: take(/^(\s|#([^#\\]|\\.)*#?)*/),
        lm: take(/^(\\|λ)/), dt: take(/^\./), lp: take(/^\(/),
        rp: take(/^\)/),
        dq: take(/^"/),
        ds: take(/^\$/),
        ib: take(/^([^`\$\\]|\$[^\{`]|\\.)*/),
        id: take(/^[^\W\d](-\w)?(\w(-\w)?)*/), sb: take(/^([^"\\]|\\.)*/),
        nm: take(/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?/)
    };
};
const null_tokens = token(['']);
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
            lhs = make('app', lhs, rhs);
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
            lhs = make(lk, le, lhs);
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
                    lhs = make(kind, lhs, rhs);
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
                (id => !id ? null : (e => !e ? null : make('uni', id, e))(readu()))(tk.id()));
        return readu();
    };
    const parenthetical = () => {
        const e = expression();
        if (!e || !tk.rp())
            return null;
        return e;
    };
    const string = () => (val => tk.dq() ? make('lit', JSON.parse(`"${val}"`)) : null)(tk.sb());
    const predefined = narrow({
        rec: 'rec'
    });
    const identifier = (c) => {
        if (c === 'rec') {
            const l = predefined[c];
            return make(l);
        }
        return make('ref', c);
    };
    const number = c => make('lit', Number.parseFloat(c));
    return [[], [
            ['lm', universal],
            ['lp', parenthetical],
            ['dq', string],
            ['id', identifier],
            ['nm', number]
        ]];
});
const never = e => { throw new Error(`never happened on kind ${e.kind}`); };
export const highlight_html = text => {
    const f = () => {
        const try0 = (cls) => (tk) => () => {
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
        const tokens = (gk, first, ...rest) => first ? gk(first)() || tokens(gk, ...rest) : false;
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
                if (tokens(try0('const'), 'nm') ||
                    tokens(try0('quant'), 'lm') ||
                    tokens(try0('quant'), 'dt') ||
                    tokens(try0('punct'), 'ds')) {
                    continue;
                }
                c = tks.id();
                if (c) {
                    const cls = c == 'true' || c == 'false' || c == 'rec' ? 'key' : 'id';
                    p.push(`<span class="hl${cls}">${c}</span>`);
                    cd('id', c);
                    continue;
                }
                if (try0(`parn${(i) % 6}`)('lp')()) {
                    i++;
                    continue;
                }
                if (try0(`parn${(i - 1) % 6}`)('rp')()) {
                    i--;
                    continue;
                }
                if (try0('quant')('dq')()) {
                    try0('const')('sb')();
                    try0('quant')('dq')();
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
    f();
    return [p.join(''), bsearch];
};
export const pretty = (() => {
    const ident = s => s;
    const parens = s => `(${s})`;
    const passthru = e => fr(e.body);
    const exact = x => () => () => x;
    const literal = e => () => JSON.stringify(e.val);
    const quantifier = op => e => (_pr, rm) => (rm ? ident : parens)(`${op}${fr(e)(0, true)}`);
    const binop = (p, op, right) => e => (pr, rm) => (pr > p ? parens : ident)(`${pretty(e.lhs)(right ? p + 1 : p, false)}${op}${pretty(e.rhs)(right ? p : p + 1, rm || pr > p)}`);
    const fr = tbl({
        uni: e => {
            let qt = `λ${e.sym}`;
            let b = e;
            for (;;) {
                if (b.kind === 'uni') {
                    qt += ` ${b.sym}`;
                    b = b.body;
                }
                else if (b.kind === 'ext') {
                    b = b.body;
                }
                else if (b.kind === 'mem') {
                    b = b.body[0];
                }
                else
                    break;
            }
            return quantifier(`${qt}.`)(b);
        },
        rec: exact('rec'),
        ref: e => () => e.sym,
        mem: () => () => "{shared}",
        ext: passthru,
        app: binop(10, ' ', false),
        lit: literal
    });
    return fr;
})();
export const to_digraph = async (t, v) => {
    const walk_name_nodes = e => {
        let t = names_token.get(e);
        if (t !== undefined)
            return;
        t = counter++;
        names_token.set(e, t);
        walk_graph_nodes(e.body[0]);
        out.push(`${t}[shape=diamond,label="${e.sym}",tooltip=""]`);
        out.push(`${t}->${nodes_token.get(e.body[0])}`);
    };
    const walk_graph_nodes = e => {
        let t = nodes_token.get(e);
        if (t !== undefined)
            return;
        t = counter++;
        nodes_token.set(e, t);
        e.kind === 'ext' ?
            (walk_name_nodes(e.name), walk_graph_nodes(e.body)) :
            e.kind === 'uni' ?
                walk_graph_nodes(e.body) :
                e.kind === 'mem' ?
                    walk_graph_nodes(e.body[0]) :
                    e.kind === 'app' ?
                        (walk_graph_nodes(e.lhs), walk_graph_nodes(e.rhs)) :
                        e.kind === 'ref' || e.kind === 'lit' || e.kind === 'rec' ?
                            void 0 :
                            never(e);
        out.push(`${t}[${e.kind === 'mem' ||
            e.kind === 'ext' ?
            'fixedsize=true,width=0.15,height=0.15,style=filled,' :
            e.kind === 'app' ?
                'fixedsize=true,width=0.5,height=0.5,' :
                e.kind === 'uni' || e.kind === 'rec' ||
                    e.kind === 'ref' || e.kind === 'lit' ? '' :
                    never(e)}shape=${e.kind === 'ext' ? 'box' :
            e.kind === 'uni' ? 'invtriangle' :
                e.kind === 'mem' || e.kind === 'app' ? 'circle' :
                    e.kind === 'ref' || e.kind === 'lit' || e.kind === 'rec' ? 'plaintext' :
                        never(e)},label="${e.kind === 'mem' ||
            e.kind === 'ext' ||
            e.kind === 'app' ? ' ' :
            e.kind === 'rec' ? `rec` :
                e.kind === 'uni' ? e.sym :
                    e.kind === 'ref' ? e.sym :
                        e.kind === 'lit' ? JSON.stringify(JSON.stringify(e.val)).slice(1, -1) :
                            never(e)}",tooltip=""]`);
        e.kind === 'ext' ? out.push(`${t}->${nodes_token.get(e.body)};${names_token.get(e.name)}->${t}[style=dotted,penwidth=4]`) :
            e.kind === 'app' ? out.push(`${t}->${nodes_token.get(e.lhs)};${t}->${nodes_token.get(e.rhs)}[dir=back]`) :
                e.kind === 'uni' ? out.push(`${t}->${nodes_token.get(e.body)}`) :
                    e.kind === 'mem' ? out.push(`${t}->${nodes_token.get(e.body[0])}`) :
                        e.kind === 'ref' ||
                            e.kind === 'rec' || e.kind === 'lit' ? void 0 :
                            never(e);
    };
    let counter = 0;
    let out = [];
    const nodes_token = new Map();
    const names_token = new Map();
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
//# sourceMappingURL=lang.js.map