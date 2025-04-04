import { scanner, read_article } from './read.js';
import { evaluate, is_closed } from './evaluate.js';
import { print_goals, print_prop } from './print.js';
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
            [/\(\*/, { token: "comment", next: "@block_comment" }],
            [/--/, { token: "comment", next: "@line_comment" }],
            [/[()]/, 'brackets'],
            [/\\|∀|->|→|\.|(\b(theorem|axiom|declare|proof|apply|intro|sorry|qed)\b)/, 'lambda'],
            [/[^\s\\∀\.\(\)\->]+/, 'reference']
        ],
        block_comment: [
            [/([^\*]|\*[^\)])+/, "comment"],
            [/\*\)/, { token: "comment", next: "@pop" }]
        ],
        line_comment: [
            [/[^\n]+/, "comment"],
            [/\n/, { token: "comment", next: "@pop" }]
        ]
    }
};
const church_language_config = {
    comments: {
        lineComment: "--",
        blockComment: ["(*", "*)"]
    },
    brackets: [
        ["(", ")"]
    ],
    autoClosingPairs: [
        { open: "(", close: ")" },
        { open: "(*", close: "*)" }
    ],
    surroundingPairs: [
        { open: "(", close: ")" },
        { open: "(*", close: "*)" }
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
    inlineSuggest: { enabled: false },
    quickSuggestions: false,
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
    'lambda': '#CC3366',
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
        "editorBracketHighlight.foreground1": "#512881",
        "editorBracketHighlight.foreground2": "#6e1680",
        "editorBracketHighlight.foreground3": "#892365",
        "editorBracketHighlight.foreground4": "#a32e5b",
        "editorBracketHighlight.foreground5": "#a13648",
        "editorBracketHighlight.foreground6": "#a85334",
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
export function create_playground(initial) {
    let kg = false;
    let ig = false;
    function ev() {
        kg = true;
        if (!ig) {
            ig = true;
            evl();
        }
    }
    async function evl() {
        while (kg) {
            kg = false;
            output.style.opacity = "50%";
            const otext = [];
            try {
                let ok = true;
                const [l, p, m] = read_article(scanner(editor.getValue(), "article"));
                m.length !== 0 && (ok = false, otext.push(`${m.join('\n')}\n\n`));
                const article = { props: new Set(p), proofs: {} };
                for (const [name, prop, proof, where] of l) {
                    const [g, m] = evaluate(proof, prop, article);
                    if (!is_closed(prop, [...article.props])) {
                        m.push(`Theorem proposition is not closed.`);
                    }
                    if (name in article.proofs) {
                        m.push(`Theorem name already used.`);
                    }
                    else {
                        article.proofs[name] = prop;
                    }
                    if (m.length !== 0 || g.length !== 0) {
                        otext.push(`(${where}): theorem ${name} ${print_prop(prop, true)}\n`);
                        m.length !== 0 && otext.push(`${m.join('\n')}\n`);
                        otext.push(`${print_goals(g)}\n\n`);
                        ok = false;
                    }
                    await new Promise(c => window.setTimeout(c, 0));
                }
                ok && otext.push("👍");
            }
            catch (e) {
                otext.push(e.toString());
            }
            output.innerHTML = '';
            output.style.removeProperty("opacity");
            output.appendChild(t(otext.join('')));
        }
        ig = false;
    }
    const proof = create_element('div', function () {
        this.style.width = "70%";
        this.style.flexShrink = "0";
    }, []);
    const editor = monaco.editor.create(proof, church_editor_config);
    editor.setValue(initial);
    const output = create_element("div", function () {
        this.tabIndex = 0;
        this.style.fontSize = "10pt";
        this.style.whiteSpace = "pre-wrap";
        this.style.overflowWrap = "break-word";
        this.style.overflowX = "hidden";
        this.style.overflowY = "scroll";
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
    }, [output]);
    const playground = create_element('div', function () {
        this.style.textAlign = "left";
        this.style.display = "inline-flex";
        this.style.flexDirection = "row";
    }, [
        proof, formatting
    ]);
    // playground.addEventListener('keydown', e =>
    //   e.key === "F4" ? (ev(), true) : true)
    const m = editor.getModel();
    m && m.onDidChangeContent(ev);
    ev();
    return [playground, editor];
}
//# sourceMappingURL=create_playground.js.map