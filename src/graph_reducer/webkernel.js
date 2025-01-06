import { read, highlight_html, pretty, to_outline, jso_to_graph, graph_to_jso } from "./lang.js";
import { make, evaluate, unthunk, sym, flatten_stringlike } from "./graph.js";
(async () => {
    document.title = 'mystery kernel';
    const include = src => new Promise(cb => {
        const js = document.createElement('script');
        js.src = src;
        js.type = 'text/javascript';
        js.addEventListener('load', cb);
        document.head.appendChild(js);
    });
    await include("./viz.js");
    await include("./lite.render.js");
    const style_element = document.createElement('style');
    const style_sheet = document.head.appendChild(style_element).sheet;
    const style_rule = style_sheet ? x => style_sheet.insertRule(x, 0) : () => { };
    style_rule(`::selection { background: #5c0a28; }`);
    style_rule(`* { margin: 0px; padding: 0px; }`);
    style_rule(`@font-face {
  font-family: CustomFont;
  src: url("./cmuntt.ttf"); }`);
    style_rule(`body {
  position: absolute;
  display: flex;
  flex-flow: column;
  inset: 0px;
  font-family: CustomFont;
  font-size: 11pt;
  line-height: 13pt; }`);
    style_rule(`.ree::after {
  content: '\\200D'; }`);
    style_rule(`@media (prefers-color-scheme: light) {
  :root {
    --foreground: black;
    --dim: gray;
    --background: white;
    --punct: #bb69d4;
    --parn0: #512881;
    --parn1: #6e1680;
    --parn2: #892365;
    --parn3: #a32e5b;
    --parn4: #a13648;
    --parn5: #a85334;
    --quant: #530ba5;
    --const: #228709;
    --key: #280a8c;
    --id: #cd3a05;
    --ws: #3e8888; } }`);
    style_rule(`@media (prefers-color-scheme: dark) {
  :root {
    --foreground: white;
    --dim: gray;
    --background: black;
    --punct: #9a1d3e;
    --parn0: #512881;
    --parn1: #6e1680;
    --parn2: #892365;
    --parn3: #a32e5b;
    --parn4: #a13648;
    --parn5: #a85334;
    --quant: #bb4088;
    --const: #96f3b5;
    --key: #7e57ff;
    --id: #ffaa8c;
    --ws: #006969; } }`);
    style_rule(`body {
  background: var(--background);
  color: var(--foreground);
  caret-color: var(--foreground); }`);
    style_rule(`.wb {
  border-top-style: solid;
  border-top-width: 1px;
  border-top-color: var(--foreground); }`);
    style_rule(`.hlpunct { color: var(--punct); }`);
    style_rule(`.hlparn0 { color: var(--parn0); }`);
    style_rule(`.hlparn1 { color: var(--parn1); }`);
    style_rule(`.hlparn2 { color: var(--parn2); }`);
    style_rule(`.hlparn3 { color: var(--parn3); }`);
    style_rule(`.hlparn4 { color: var(--parn4); }`);
    style_rule(`.hlparn5 { color: var(--parn5); }`);
    style_rule(`.hlquant { color: var(--quant); }`);
    style_rule(`.hlconst { color: var(--const); }`);
    style_rule(`.hlkey { color: var(--key); }`);
    style_rule(`.hlid { color: var(--id); }`);
    style_rule(`.hlws { color: var(--ws); }`);
    style_rule(`svg .edge path, svg .node ellipse, svg .node polygon {
  stroke: var(--foreground);
  fill: none; }`);
    style_rule(`svg .node text, svg .edge polygon, svg .node.start polygon {
  stroke: none;
  fill: var(--foreground); }`);
    style_rule(`svg .node.start text {
  stroke: none;
  fill: var(--background); }`);
    const element = (tag, mod, children) => {
        const elem = document.createElement(tag);
        mod.apply(elem);
        elem.append(...children);
        return elem;
    };
    const txt = x => document.createTextNode(x);
    const coop = () => new Promise(cb => window.setTimeout(cb, 0));
    const reset_link = element('a', function () {
        this.href = '#';
        this.addEventListener('click', () => reset());
    }, [
        txt('reset')
    ]);
    const debug_link = element('a', function () {
        this.innerText = 'debug';
        this.href = '#';
        this.addEventListener('click', async () => {
            if (debug_window && !debug_window.closed)
                return;
            const d = window.open('about:blank', '_blank', "height=200,width=200");
            if (!d)
                return;
            await new Promise(cb => d.addEventListener('load', cb));
            const debug_style_element = document.createElement('style');
            d.document.head.appendChild(debug_style_element);
            const debug_style_sheet = debug_style_element.sheet;
            if (!debug_style_sheet)
                return;
            if (!style_sheet)
                return;
            for (let i = 0; i < style_sheet.cssRules.length; i++) {
                const r = style_sheet.cssRules[i];
                if (r) {
                    debug_style_sheet.insertRule(r.cssText);
                }
            }
            d.document.body.innerHTML = '';
            d.document.body.style.whiteSpace = 'pre';
            debug_window = d;
        });
    }, []);
    const intro = element('div', function () {
        this.style.flex = "0 1 auto";
    }, [reset_link, txt(' '), debug_link]);
    document.body.appendChild(intro);
    let debug_window = null;
    const system_common_style = s => {
        s.border = "none";
        s.background = "transparent";
        s.color = "inherit";
        s.font = "inherit";
        s.whiteSpace = "pre";
        s.overflow = "scroll";
    };
    const system = element('div', function () {
        this.className = 'ree';
        this.tabIndex = 1;
        this.spellcheck = false;
        this.toggleAttribute('contenteditable');
        this.style.width = "100%";
        this.style.height = "200pt";
        this.style.outline = "none";
        this.style.setProperty('-webkit-text-fill-color', "transparent");
        this.style.resize = "vertical";
        system_common_style(this.style);
    }, []);
    const system2 = element('div', function () {
        this.className = 'ree';
        this.style.position = "absolute";
        this.style.pointerEvents = "none";
        this.style.inset = "0px";
        system_common_style(this.style);
    }, []);
    let ranges;
    const update_highlight = () => {
        const [t, r] = highlight_html(system.textContent || '');
        ranges = r;
        system2.innerHTML = t;
    };
    system.addEventListener('keydown', function (e) {
        if (e.key === "Tab" && !e.ctrlKey && !e.altKey && !e.metaKey) {
            e.preventDefault();
            replace_text((t, a, b) => {
                if (e.shiftKey) {
                    if (a > 1 && t.substring(a - 2, a) === "  ") {
                        return [t.substring(0, a - 2) + t.substring(a), a - 2, b - 2];
                    }
                    else
                        return [t, a, b];
                }
                else {
                    return [t.substring(0, a) + '  ' + t.substring(a), a + 2, b + 2];
                }
            });
        }
        else if (e.key === "\\" && !e.ctrlKey && !e.altKey && !e.metaKey) {
            e.preventDefault();
            replace_text((t, a, b) => {
                let insert = 'λ';
                const [rl, rr] = ranges(a);
                const rlk = rl ? rl[2] : null;
                const rrk = rr ? rr[2] : null;
                if (rrk === 'sb' || rlk === 'sb' || rrk === 'ib' || rlk === 'ib') {
                    insert = '\\';
                }
                return [t.substring(0, a) + insert + t.substring(b), a + insert.length, a + insert.length];
            });
        }
        else if (e.key === "Enter") {
            e.preventDefault();
            if (e.ctrlKey) {
                reset();
            }
            else {
                replace_selection(false, '\n');
            }
        }
        else if (e.key === "Enter") {
            e.preventDefault();
        }
    });
    system.addEventListener('input', update_highlight);
    system.addEventListener('scroll', () => {
        system2.scrollTo({ top: system.scrollTop, left: system.scrollLeft });
    });
    system.addEventListener('copy', function (e) {
        e.preventDefault();
        var selectedText = window.getSelection();
        if (!selectedText) {
            return;
        }
        var range = selectedText.getRangeAt(0);
        var selectedTextReplacement = range.toString();
        if (!e.clipboardData) {
            return;
        }
        e.clipboardData.setData('text/plain', selectedTextReplacement);
    });
    const replace_text = content => {
        if (window.getSelection) {
            const z = window.getSelection();
            if (!z) {
                return;
            }
            const y = z.getRangeAt(0);
            if (y.startContainer === system) {
                const t = system.childNodes[0]?.textContent || '';
                const [tp, ap, bp] = content(t, 0, t.length);
                const system_text = txt(tp);
                while (system.childNodes[0])
                    system.removeChild(system.childNodes[0]);
                system.appendChild(system_text);
                z.removeAllRanges();
                const r = document.createRange();
                r.setStart(system_text, ap);
                r.setEnd(system_text, bp);
                z.addRange(r);
                update_highlight();
            }
            else if (y.startContainer.parentElement === system) {
                const t = system.textContent || '';
                const a = y.startOffset;
                const b = y.endOffset;
                const [tp, ap, bp] = content(t, a, b);
                const system_text = txt(tp);
                while (system.childNodes[0])
                    system.removeChild(system.childNodes[0]);
                system.appendChild(system_text);
                z.removeAllRanges();
                const r = document.createRange();
                r.setStart(system_text, ap);
                r.setEnd(system_text, bp);
                z.addRange(r);
                update_highlight();
            }
        }
    };
    const replace_selection = (select, dt) => replace_text((t, a, b) => [t.substring(0, a) + dt + t.substring(b), a + (select ? 0 : dt.length), a + dt.length]);
    system.addEventListener('paste', function (e) {
        e.preventDefault();
        const d = e.clipboardData;
        if (d) {
            const dt = d.getData('Text');
            replace_selection(true, dt);
        }
    });
    system.appendChild(txt(localStorage.getItem('kernel-system') || ''));
    update_highlight();
    const entry = element('div', function () {
        this.className = "wb";
        this.style.flex = "0 1 auto";
        this.style.position = "relative";
    }, [system2, system]);
    document.body.appendChild(entry);
    const output = element('div', function () {
        this.tabIndex = 2;
        this.className = "wb";
        this.style.flex = "1 1 auto";
        this.style.position = "relative";
        this.style.whiteSpace = "pre-wrap";
        this.style.overflowWrap = "break-word";
        this.style.wordBreak = "break-all";
        this.style.overflowX = "hidden";
        this.style.overflowY = "scroll";
    }, []);
    document.body.appendChild(output);
    output.addEventListener('keydown', async (e) => {
        if (e.ctrlKey && e.key == 'v') {
            return true;
        }
        if (!e.metaKey && !e.altKey) {
            e.preventDefault();
            e.key === 'a'; // converts i.key to single-letter form lmao
            const handler = wakeHandler;
            if (handler) {
                wakeHandler = () => { };
                handler(make(null, 'cns', make(null, 'str', 'key'), make(null, 'str', e.key)));
            }
        }
        return false;
    });
    output.addEventListener('paste', e => {
        e.preventDefault();
        const d = e.clipboardData;
        if (d) {
            const dt = d.getData('Text');
            const handler = wakeHandler;
            if (handler) {
                wakeHandler = () => { };
                handler(make(null, 'cns', make(null, 'str', 'paste'), make(null, 'str', dt)));
            }
        }
    });
    let wakeHandler = () => { };
    let cancel = { value: false };
    // result_box.appendChild(txt(pretty(io)(0, true)))
    // const jso: (GraphN | NameN)[] = []
    // const t = graph_to_jso(io, new Map(), jso)
    // io = jso_to_graph(t, [], jso) as Graph
    const reset = async () => {
        const vars = {};
        let vars_text = localStorage.getItem('kernel-vars');
        if (vars_text) {
            const [vn, q] = JSON.parse(vars_text);
            const p = [];
            for (const i in vn) {
                try {
                    vars[i] = jso_to_graph(vn[i], p, q);
                }
                catch (e) {
                    console.log('error converting vars jso to graph');
                }
            }
        }
        output.innerHTML = '';
        const t = system.textContent || '';
        localStorage.setItem('kernel-system', t);
        wakeHandler = () => { };
        cancel.value = true;
        cancel = { value: false };
        let program = read(t);
        if (program) {
            let io = program;
            const err = () => {
                output.appendChild(txt(`bad io:\n`));
                output.appendChild(txt(pretty(io)(0, true)));
                output.scrollTo(0, output.scrollHeight);
            };
            const cancel_me = cancel;
            const queue = [];
            for (;;) {
                if (cancel_me.value)
                    return null;
                io = unthunk(evaluate(io));
                if (debug_window && !debug_window.closed) {
                    debug_window.document.body.innerHTML = '';
                    const [head, ...rest] = to_outline(io);
                    const expr = document.createElement('div');
                    debug_window.document.body.appendChild(expr);
                    const expr_line = document.createElement('div');
                    expr.appendChild(expr_line);
                    expr_line.style.whiteSpace = "pre-wrap";
                    expr_line.appendChild(txt(head));
                    for (let i = 0; i < rest.length; i++) {
                        const expr_line = document.createElement('div');
                        expr.appendChild(expr_line);
                        expr_line.style.display = 'flex';
                        const no = document.createElement('div');
                        expr_line.appendChild(no);
                        no.style.captionSide = 'top';
                        no.style.fontWeight = 'bold';
                        no.style.marginRight = "10pt";
                        no.appendChild(txt(`${i}`));
                        const tx = document.createElement('div');
                        tx.style.whiteSpace = "pre-wrap";
                        expr_line.appendChild(tx);
                        tx.appendChild(txt(rest[i] || ''));
                    }
                    await coop();
                }
                if (io.kind === 'app') {
                    const l = io.lhs;
                    if (l.kind === 'app') {
                        const ll = l.lhs;
                        if (ll.kind === 'ref') {
                            if (ll.sym === bindId) {
                                queue.unshift(io.rhs);
                                io = l.rhs;
                                continue;
                            }
                            else if (ll.sym === setVarId) {
                                const s = flatten_stringlike(l.rhs);
                                if (s == null)
                                    return err();
                                vars[s] = unthunk(evaluate(io.rhs));
                                io = make(null, 'tru');
                            }
                            else
                                return err();
                        }
                        else
                            return err();
                    }
                    else if (l.kind === 'ref') {
                        if (l.sym == putStrId) {
                            const s = flatten_stringlike(io.rhs);
                            if (s == null)
                                return err();
                            output.appendChild(txt(s));
                            output.scrollTo(0, output.scrollHeight);
                            io = make(null, 'tru');
                        }
                        else if (l.sym === returnId) {
                            io = io.rhs;
                        }
                        else if (l.sym === getVarId) {
                            const s = flatten_stringlike(io.rhs);
                            if (s == null)
                                return err();
                            const e = vars[s];
                            if (!e)
                                return err();
                            io = e;
                        }
                        else if (l.sym === delVarId) {
                            const s = flatten_stringlike(io.rhs);
                            if (s == null)
                                return err();
                            delete vars[s];
                            io = make(null, 'tru');
                        }
                        else if (l.sym === readId) {
                            const s = flatten_stringlike(io.rhs);
                            if (s == null)
                                return err();
                            const a = read(s);
                            if (!a)
                                return err();
                            io = make(null, 'qot', a);
                        }
                        else if (l.sym === evalId) {
                            const r = unthunk(evaluate(io.rhs));
                            if (r.kind === 'qot') {
                                io = r.body;
                            }
                            else
                                return err();
                        }
                        else if (l.sym === printId) {
                            const r = unthunk(evaluate(io.rhs));
                            output.appendChild(txt(pretty(r)(0, true)));
                            output.scrollTo(0, output.scrollHeight);
                            io = make(null, 'tru');
                        }
                        else
                            return err();
                    }
                    else
                        return err();
                }
                else if (io.kind === 'ref') {
                    if (io.sym === sleepId) {
                        io = (await new Promise(cb => wakeHandler = cb));
                    }
                    else if (io.sym === clearId) {
                        output.innerText = '';
                        io = make(null, 'tru');
                    }
                    else if (io.sym === coopId) {
                        await coop();
                        io = make(null, 'tru');
                    }
                    else
                        return err();
                }
                else
                    return err();
                const h = queue.shift();
                if (!h)
                    break;
                io = make(null, 'app', h, io);
            }
            const vn = {};
            const p = new Map();
            const q = [];
            for (const i in vars) {
                vn[i] = graph_to_jso(vars[i], p, q);
            }
            localStorage.setItem('kernel-vars', JSON.stringify([vn, q]));
            io = unthunk(evaluate(io));
            const result_box = document.createElement('div');
            output.appendChild(result_box);
            result_box.className = "wb";
            result_box.appendChild(txt(pretty(io)(0, true)));
            // const vars_box = document.createElement('div')
            // output.appendChild(vars_box)
            // vars_box.appendChild(await to_digraph('result', vars))
            output.scrollTo(0, output.scrollHeight);
        }
        else {
            output.appendChild(txt(`syntax error\n`));
            output.scrollTo(0, output.scrollHeight);
        }
    };
    const delVarId = sym('del-var');
    const setVarId = sym('set-var');
    const getVarId = sym('get-var');
    const putStrId = sym('put-string');
    const printId = sym('print');
    const sleepId = sym('sleep');
    const bindId = sym('bind');
    const returnId = sym('return');
    const clearId = sym('clear');
    const coopId = sym('coop');
    const readId = sym('read');
    const evalId = sym('eval');
})();
//# sourceMappingURL=webkernel.js.map