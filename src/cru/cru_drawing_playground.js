import { read, tokenizer } from './cru.js';
import { exec } from './cru_drawing_io.js';
import { scanner } from '../scanner.js';
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
    const run_button = create_element('div', function () { }, [
        document.createTextNode("Run")
    ]);
    const menu = create_element('div', function () {
        this.setAttribute('id', 'input');
        this.style.width = "100%";
        this.style.height = "20pt";
        this.style.flexShrink = "0",
            this.style.whiteSpace = "pre",
            this.style.display = "flex";
        this.style.flexDirection = "row";
    }, [
        run_button
    ]);
    const entry = create_element('div', function () {
        this.setAttribute('id', 'input');
        this.style.width = "100%";
        this.style.height = "40%";
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
                    [/\/\*/, { token: "punctuation", next: "@block_comment" }],
                    [/\/\//, { token: "punctuation", next: "@line_comment" }],
                    [/"/, { token: 'punctuation', next: "@string" }],
                    [/[+-]?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?/, 'constant.numerical'],
                    [/true|false|void/, 'constant.boolean'],
                    [/->/, 'punctuation'],
                    [/\$/, 'keyword.operator'],
                    [/\\|=|\(|\)|,|where|let|in/, 'punctuation'],
                    [/\w[\w0-9]*/, 'entity.name']
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
            wordPattern: /\w[\w0-9]*/
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
        editor.setValue(localStorage.getItem('cru-drawing-playground-system') || '');
        editor.getModel().onDidChangeContent(() => {
            localStorage.setItem('cru-drawing-playground-system', editor.getValue());
        });
        const keybuf = [];
        let keywait;
        async function run() {
            try {
                output.innerHTML = '';
                const canvas = create_element("canvas", function () {
                    this.width = 1500;
                    this.height = 1500;
                }, []);
                const ctxp = canvas.getContext("2d");
                if (!ctxp) {
                    throw new Error("couldn't get drawing context");
                }
                const ctx = ctxp;
                output.appendChild(canvas);
                const text = editor.getValue();
                const tree = await read(tokenizer(scanner(text)));
                await exec(tree, ctx);
            }
            catch (e) {
                output.appendChild(document.createTextNode(e.toString()));
            }
        }
        document.addEventListener('keydown', ev => {
            if (ev.key === "F4")
                run();
            return true;
        });
        run_button.addEventListener('click', run);
        output.addEventListener('keydown', e => {
            keybuf.push(e.key);
            if (keywait) {
                keywait(keybuf.shift());
            }
            e.preventDefault();
            e.stopPropagation();
            return false;
        });
    });
})();
//# sourceMappingURL=cru_drawing_playground.js.map