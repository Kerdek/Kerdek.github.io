import { exec } from './io.js';
import { scanner } from '../scanner.js';
import { read_term } from './read.js';
import { tokenizer } from './tokenizer.js';
import { print_term, print_type } from './print.js';
import { evaluate } from './evaluate.js';
import { typecheck } from './typecheck.js';
import { subsume } from './subsume.js';
import { typ_iov, typ_unk } from './graph.js';
(async () => {
    document.title = "cru playground";
    const include = (type, src) => new Promise(cb => {
        const js = document.createElement('script');
        js.src = src;
        js.type = type;
        js.addEventListener('load', cb);
        document.head.appendChild(js);
    });
    await include('text/javascript', '../monaco/loader.js');
    require.config({ paths: { vs: '../monaco' } });
    const style_rule = (() => {
        const style = document.head.appendChild(document.createElement('style'));
        const ss = style.sheet;
        return ss ? x => ss.insertRule(x, 0) : () => -1;
    })();
    style_rule(`#output p {
  color: red; }`);
    style_rule(`@font-face {
  font-family: CMU Typewriter Text;
  src: url("../cmuntt.ttf"); }`);
    style_rule(`html {
  width: 100%;
  height: 100%; }`);
    style_rule(`body {
  width: 100%;
  height: 100%;
  font-family: CMU Typewriter Text;
  font-size: 11pt;
  line-height: 13pt;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column; }`);
    style_rule(`@media (prefers-color-scheme: light) {
  body {
    background: white;
    color: black;
    caret-color: black; } }`);
    style_rule(`@media (prefers-color-scheme: dark) {
  body {
    background: black;
    color: white;
    caret-color: white; } }`);
    const create_element = (tag, mod, children) => {
        const elem = document.createElement(tag);
        mod.apply(elem);
        elem.append(...children);
        return elem;
    };
    const menu = create_element('div', function () {
        this.setAttribute('id', 'input');
        this.style.width = "100%";
        this.style.height = "20pt";
        this.style.flexShrink = "0",
            this.style.whiteSpace = "pre",
            this.style.display = "flex";
        this.style.flexDirection = "row";
    }, []);
    const spacer = () => create_element('div', function () { }, [
        document.createTextNode("   ")
    ]);
    const button = text => create_element('div', function () { }, [
        document.createTextNode(text)
    ]);
    const run_button = button("Run");
    const eval_button = button("Evaluate");
    const print_button = button("Check Type");
    menu.append(run_button, spacer(), eval_button, spacer(), print_button);
    const entry = create_element('div', function () {
        this.setAttribute('id', 'input');
        this.style.width = "100%";
        this.style.height = "70%";
        this.style.flexShrink = "0";
    }, []);
    const output = create_element("div", function () {
        this.tabIndex = 0;
        this.style.width = "100%";
        this.style.whiteSpace = "pre-wrap";
        this.style.overflowWrap = "break-word";
        this.style.overflowX = "hidden";
        this.style.overflowY = "scroll";
        this.style.wordBreak = "break-all";
        this.style.flexShrink = "1";
        this.style.flexGrow = "1";
        this.style.borderTopStyle = "solid";
        this.style.borderTopColor = "white";
        this.style.borderTopWidth = "1px";
    }, []);
    document.body.append(menu, entry, output);
    require(['vs/editor/editor.main'], () => {
        monaco.languages.register({ id: 'cru' });
        monaco.languages.setMonarchTokensProvider('cru', {
            brackets: [
                { open: "\\(", close: "\\)", token: "punctuation" }
            ],
            unicode: true,
            includeLF: true,
            defaultToken: "source",
            ignoreCase: false,
            tokenizer: {
                root: [
                    [/ |\t|\n/, 'whitespace'],
                    [/\/\*/, { token: "punctuation", next: "@block_comment" }],
                    [/\/\//, { token: "punctuation", next: "@line_comment" }],
                    [/"/, { token: 'punctuation', next: "@string" }],
                    [/[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?/, 'constant.numerical'],
                    [/\b(true|false|undefined)\b/, 'constant.boolean'],
                    [/->/, 'punctuation'],
                    [/\$/, 'keyword.operator'],
                    [/\\|=|#|\.|\(|\)|\{|\}|\[|\]|:|,|\b(where|in|let|type)\b/, 'punctuation'],
                    [/[A-Z][\w\d]*/, 'entity.name.type'],
                    [/[a-z][\w\d]*/, 'entity.name']
                ],
                block_comment: [
                    [/([^\*]|\*[^\/])+/, "comment"],
                    [/\*\//, { token: "punctuation", next: "@pop" }]
                ],
                line_comment: [
                    [/[^\n]+/, "comment"],
                    [/\n/, { token: "comment", next: "@pop" }]
                ],
                string: [
                    [/([^"\\]|\\.)+/, "string"],
                    [/"/, { token: "punctuation", next: "@pop" }]
                ]
            }
        });
        monaco.languages.setLanguageConfiguration('cru', {
            comments: {
                "lineComment": "//",
                "blockComment": ["/*", "*/"]
            },
            brackets: [
                ["(", ")"]
            ],
            autoClosingPairs: [
                { open: "(", close: ")" }
            ],
            surroundingPairs: [
                { open: "(", close: ")" }
            ],
            folding: { "markers": { start: /\(/, end: /\)/ } },
            wordPattern: /\w[\w\d]*/
        });
        const editor = monaco.editor.create(entry, {
            language: 'cru',
            minimap: {
                maxColumn: 80
            },
            fontFamily: 'CMU Typewriter Text',
            tabSize: 2,
            insertSpaces: true,
            automaticLayout: true
        });
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            monaco.editor.defineTheme('hcblack2', {
                base: 'hc-black',
                inherit: true,
                rules: [
                    { token: 'entity.name', foreground: '#CCCCFF' },
                    { token: 'entity.name.type', foreground: '#ffaa8c' },
                    { token: 'keyword.operator', foreground: '#55FFFF' },
                    { token: 'string', foreground: '#AAAAFF' },
                    { token: 'punctuation', foreground: '#FF55AA' },
                    { token: 'constant', foreground: '#AAFFAA' },
                    { token: 'comment', foreground: '#55AA55' }
                ],
                colors: {
                    "editorIndentGuide.background": "#555555"
                }
            });
            monaco.editor.setTheme('hcblack2');
        }
        editor.setValue(localStorage.getItem('crut-playground-system') || '');
        editor.getModel().onDidChangeContent(() => {
            localStorage.setItem('crut-playground-system', editor.getValue());
        });
        async function run() {
            output.innerHTML = '';
            const text = editor.getValue();
            try {
                const tree = await read_term(tokenizer(scanner(text, window.location.href)));
                const t = typecheck(tree);
                if (typeof t === "string") {
                    throw new Error(t);
                }
                const u = subsume(t[0], typ_iov(typ_unk()));
                if (typeof u === "string") {
                    throw new Error(u);
                }
                output.appendChild(document.createTextNode(`\n-OK-\n${print_term(evaluate(await exec(tree, s => {
                    output.appendChild(document.createTextNode(s));
                    output.scrollTop = output.scrollHeight;
                })))}`));
            }
            catch (e) {
                output.appendChild(document.createTextNode(`\n-ERROR-\n${e.toString()}`));
            }
        }
        async function sj() {
            localStorage.setItem('cru-playground-system', editor.getValue());
            output.innerHTML = '';
            const text = editor.getValue();
            try {
                const t = typecheck(await read_term(tokenizer(scanner(text, window.location.href))));
                output.appendChild(document.createTextNode(`${typeof t === "string" ? t : print_type(t[0])}`));
            }
            catch (e) {
                output.appendChild(document.createTextNode(`\n-ERROR-\n${e.toString()}`));
            }
        }
        async function ev() {
            output.innerHTML = '';
            const text = editor.getValue();
            try {
                const tree = await read_term(tokenizer(scanner(text, window.location.href)));
                const t = typecheck(tree);
                if (typeof t === "string") {
                    throw new Error(t);
                }
                output.appendChild(document.createTextNode(`\n-OK-\n${print_term(evaluate(tree))}`));
            }
            catch (e) {
                output.appendChild(document.createTextNode(`\n-ERROR-\n${e.toString()}`));
            }
        }
        document.addEventListener('keydown', ev => {
            if (ev.key === "F4")
                run();
            return true;
        });
        run_button.addEventListener('click', run);
        eval_button.addEventListener('click', ev);
        print_button.addEventListener('click', sj);
    });
})();
//# sourceMappingURL=playground.js.map