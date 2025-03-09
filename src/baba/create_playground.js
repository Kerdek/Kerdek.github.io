import { scanner } from '../scanner.js';
import { exec } from './evaluate.js';
import { read } from './read.js';
import { tokenizer } from './tokenizer.js';
const include = (type, src) => new Promise(cb => {
    const js = document.createElement('script');
    js.src = src;
    js.type = type;
    js.addEventListener('load', cb);
    document.head.appendChild(js);
});
await include('text/javascript', '../monaco/loader.js');
require.config({ paths: { vs: '../monaco' } });
await new Promise(cb => require(['vs/editor/editor.main'], cb));
const baba_monarch_tokens = {
    brackets: [
        { open: "(", close: ")", token: "brackets" }
    ],
    unicode: true,
    includeLF: true,
    defaultToken: "invalid",
    ignoreCase: false,
    operators: ['$'],
    symbols: /\\|λ|\*|\.|#/,
    tokenizer: {
        root: [
            [/\/\*/, { token: "punct", next: "@block_comment" }],
            [/\/\//, { token: "punct", next: "@line_comment" }],
            [/"/, { token: 'punct', next: "@dstring" }],
            [/'/, { token: 'punct', next: "@sstring" }],
            [/[+-]?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?/, 'numerical'],
            [/[\+\-\*\/%=!<>]/, 'operator'],
            [/true|false/, 'numerical'],
            [/[\(\)\[\]\{\}]/, 'brackets'],
            [/[;,\.]/, 'punct'],
            [/\b(if|else|for|in|while|do|fun|break|continue|return)\b/, 'punct'],
            [/\w[\w0-9]*/, 'reference']
        ],
        block_comment: [
            [/([^\*]|\*[^\/])+/, "comment"],
            [/\*\//, { token: "punct", next: "@pop" }]
        ],
        line_comment: [
            [/[^\n]+/, "comment"],
            [/\n/, { token: "comment", next: "@pop" }]
        ],
        dstring: [
            [/([^"\\]|\\.)+/, "string"],
            [/"/, { token: "punct", next: "@pop" }]
        ],
        sstring: [
            [/([^'\\]|\\.)+/, "string"],
            [/'/, { token: "punct", next: "@pop" }]
        ]
    }
};
const baba_language_config = {
    comments: {
        lineComment: "//",
        blockComment: ["/*", "*/"]
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
    folding: { "markers": { start: /\(/, end: /\)/ } }
};
const baba_editor_config = {
    bracketPairColorization: {
        enabled: true
    },
    matchBrackets: "always",
    fontSize: 18,
    rulers: [40, 80],
    language: 'baba',
    minimap: {
        enabled: false
    },
    // maxColumn: 80 },
    fontFamily: 'CMU Typewriter Text',
    tabSize: 2,
    insertSpaces: true,
    automaticLayout: true
};
const use_dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
export const playground_colors_dark = {
    'contrast': '#FFFFFF',
    'invalid': '#FF0000',
    'reference': '#FFAACC',
    'punct': '#AA2255',
    'brackets': '#5522AA',
    'operator': '#55FFFF',
    'string': '#AAAAFF',
    'numerical': '#AAFFAA',
    'comment': '#55AA55',
    "lineHighlight": '#1b040a',
    "ruler": "#002222",
    "guide": "#555555"
};
export const playground_colors_light = {
    'contrast': '#000000',
    'invalid': '#FF0000',
    'reference': '#471127',
    'punct': '#8f0b3c',
    'brackets': '#3c1085',
    'operator': '#55FFFF',
    'string': '#151554',
    'numerical': '#126e12',
    'comment': '#339133',
    "lineHighlight": "#e0baca",
    "ruler": "#ccffff",
    "guide": "#AAAAAA"
};
export const playground_colors = use_dark ? playground_colors_dark : playground_colors_light;
const baba_theme = {
    base: use_dark ? 'hc-black' : 'vs',
    inherit: true,
    rules: [
        { token: 'invalid', foreground: playground_colors.invalid },
        { token: 'reference', foreground: playground_colors.reference },
        { token: 'punct', foreground: playground_colors.punct },
        { token: 'brackets', foreground: playground_colors.brackets },
        { token: 'operator', foreground: playground_colors.operator },
        { token: 'string', foreground: playground_colors.string },
        { token: 'numerical', foreground: playground_colors.numerical },
        { token: 'comment', foreground: playground_colors.comment }
    ],
    colors: {
        "editor.lineHighlightBackground": playground_colors.lineHighlight,
        "editorRuler.foreground": playground_colors.ruler,
        "editorIndentGuide.background": playground_colors.guide
    }
};
monaco.languages.register({ id: 'baba' });
monaco.languages.setMonarchTokensProvider('baba', baba_monarch_tokens);
monaco.languages.setLanguageConfiguration('baba', baba_language_config);
monaco.editor.defineTheme('baba', baba_theme);
monaco.editor.setTheme('baba');
const create_element = (tag, mod, children) => {
    const elem = document.createElement(tag);
    mod.apply(elem);
    elem.append(...children);
    return elem;
};
const t = s => document.createTextNode(s);
const button = (text, title, action) => create_element('div', function () {
    this.title = title;
    this.style.paddingRight = '13pt';
    this.addEventListener('mouseenter', () => this.style.color = playground_colors.punct);
    this.addEventListener('mouseleave', () => this.style.color = 'revert');
    this.addEventListener('click', action);
}, [
    t(text)
]);
export function create_playground(initial) {
    async function run() {
        output.innerHTML = '';
        const text = editor.getValue();
        try {
            const reada = read(tokenizer(scanner(text, window.location.href)));
            exec(reada, s => {
                output.appendChild(t(s));
                output.scrollTop = output.scrollHeight;
            });
            output.scrollTop = output.scrollHeight;
        }
        catch (e) {
            output.appendChild(t(e.toString()));
            output.scrollTop = output.scrollHeight;
        }
    }
    const run_button = button("Run", "(F4) Run the program.", run);
    const menu = create_element('div', function () {
        this.style.width = "100%";
        this.style.flexShrink = "0";
        this.style.display = "flex";
        this.style.overflow = "hidden";
        this.style.flexDirection = "row";
        this.style.borderBottomStyle = "solid";
        this.style.borderBottomColor = playground_colors.contrast;
        this.style.borderBottomWidth = "1px";
    }, [
        run_button
    ]);
    const entry = create_element('div', function () {
        this.style.width = "100%";
        this.style.height = "70%";
        this.style.flexShrink = "0";
    }, []);
    const editor = monaco.editor.create(entry, baba_editor_config);
    editor.setValue(initial);
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
        this.style.borderTopColor = playground_colors.contrast;
        this.style.borderTopWidth = "1px";
    }, []);
    const playground = create_element('div', function () {
        this.style.textAlign = "left";
        this.style.display = "inline-flex";
        this.style.flexDirection = "column";
    }, [
        menu, entry, output
    ]);
    playground.addEventListener('keydown', e => (e.key === "F4" ?
        run() :
        void 0,
        true));
    return [playground, editor];
}
//# sourceMappingURL=create_playground.js.map