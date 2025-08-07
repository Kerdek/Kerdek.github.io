import { read } from './read.js';
import { dhomproc, homproc } from './run.js';
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
const church_monarch_tokens = {
    brackets: [
        { open: "(", close: ")", token: "brackets" }
    ],
    unicode: true,
    includeLF: true,
    defaultToken: "invalid",
    ignoreCase: false,
    operators: [],
    symbols: /\\|λ|\*|\.|#/,
    tokenizer: {
        root: [
            [/[()$]/, 'brackets'],
            [/\\|λ|\./, 'lambda'],
            [/[^\s\\λ\.\(\)]+/, 'reference']
        ]
    }
};
const church_language_config = {
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
const church_editor_config = {
    bracketPairColorization: {
        enabled: true
    },
    matchBrackets: "always",
    fontSize: 18,
    rulers: [40, 80],
    language: 'church',
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
    'lambda': '#AA2255',
    'brackets': '#5522AA',
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
    'lambda': '#8f0b3c',
    'brackets': '#3c1085',
    'string': '#151554',
    'numerical': '#126e12',
    'comment': '#339133',
    "lineHighlight": "#e0baca",
    "ruler": "#ccffff",
    "guide": "#AAAAAA"
};
export const playground_colors = use_dark ? playground_colors_dark : playground_colors_light;
const church_theme = {
    base: use_dark ? 'hc-black' : 'vs',
    inherit: true,
    rules: [
        { token: 'invalid', foreground: playground_colors.invalid },
        { token: 'reference', foreground: playground_colors.reference },
        { token: 'lambda', foreground: playground_colors.lambda },
        { token: 'brackets', foreground: playground_colors.brackets },
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
monaco.languages.register({ id: 'church' });
monaco.languages.setMonarchTokensProvider('church', church_monarch_tokens);
monaco.languages.setLanguageConfiguration('church', church_language_config);
monaco.editor.defineTheme('church', church_theme);
monaco.editor.setTheme('church');
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
    this.addEventListener('mouseenter', () => this.style.color = playground_colors.lambda);
    this.addEventListener('mouseleave', () => this.style.color = 'revert');
    this.addEventListener('click', action);
}, [
    t(text)
]);
export function create_playground(initial) {
    let f;
    async function ev() {
        const text = editor.getValue();
        try {
            f = eval(`${dhomproc(read(text).to_JS)}`);
            update();
        }
        catch (e) {
            output.appendChild(t(e.toString()));
        }
    }
    let mode = "term";
    async function update() {
        output.innerHTML = '';
        try {
            if (typeof f !== "function")
                throw "Not a function.";
            const ff = f;
            homproc((call, cc, ret) => call(ff(10), x => call(x(y => y + 1))));
            output.appendChild(t(v));
            await new Promise(c => window.setTimeout(c, 0));
        }
        finally { }
    }
    try {
    }
    catch (e) {
        output.appendChild(t(e.toString()));
    }
}
const entry = create_element('div', function () {
    this.style.height = "70%";
    this.style.flexShrink = "0";
}, []);
const editor = monaco.editor.create(entry, church_editor_config);
editor.setValue(initial);
const eval_button = button("Evaluate", "(F4) Evaluate the program and show the result.", ev);
const menu = create_element('div', function () {
    this.style.flexShrink = "0";
    this.style.display = "flex";
    this.style.overflow = "hidden";
    this.style.flexDirection = "row";
    this.style.borderTopStyle = "solid";
    this.style.borderTopColor = playground_colors.contrast;
    this.style.borderTopWidth = "1px";
}, [
    eval_button
]);
const formats = create_element("div", function () {
    this.style.flexShrink = "0";
    this.style.flexGrow = "0";
    this.style.overflowX = "hidden";
    this.style.overflowY = "scroll";
    this.style.borderRightStyle = "solid";
    this.style.borderRightColor = playground_colors.contrast;
    this.style.borderRightWidth = "1px";
}, [
    button("Lambda Term", "Just print the term.", () => (mode = "term", update())),
    button("Boolean", "Interpret the result as a Church boolean.", () => (mode = "bool", update())),
    button("Church Numeral", "Interpret the result as a Church numeral.", () => (mode = "cnum", update())),
    button("Scott Numeral", "Interpret the result as a Scott numeral.", () => (mode = "jnum", update())),
    button("Base 2 LE", "Interpret the result as a base 2 little endian list.", () => (mode = "bnum", update())),
    button("Base 10 LE", "Interpret the result as a base 10 little endian list.", () => (mode = "dnum", update())),
    button("Church ASCII", "Interpret the result as an ascii string of Church numerals.", () => (mode = "cstr", update())),
    button("Scott ASCII", "Interpret the result as an ascii string of Just numerals.", () => (mode = "jstr", update()))
]);
const output = create_element("div", function () {
    this.tabIndex = 0;
    this.style.whiteSpace = "pre-wrap";
    this.style.overflowWrap = "break-word";
    this.style.overflowX = "hidden";
    this.style.overflowY = "scroll";
    this.style.wordBreak = "break-all";
    this.style.flexShrink = "1";
    this.style.flexGrow = "1";
}, []);
const formatting = create_element("div", function () {
    this.tabIndex = 0;
    this.style.display = "flex";
    this.style.flexDirection = "row";
    this.style.overflowX = "hidden";
    this.style.overflowY = "hidden";
    this.style.flexShrink = "1";
    this.style.flexGrow = "1";
    this.style.borderTopStyle = "solid";
    this.style.borderTopColor = playground_colors.contrast;
    this.style.borderTopWidth = "1px";
}, [formats, output]);
const playground = create_element('div', function () {
    this.style.textAlign = "left";
    this.style.display = "inline-flex";
    this.style.flexDirection = "column";
}, [
    entry, menu, formatting
]);
playground.addEventListener('keydown', e => e.key === "F4" ? (ev(), true) : true);
return [playground, editor];
//# sourceMappingURL=create_playground.js.map