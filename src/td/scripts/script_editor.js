import { html_element, text_node } from "./dom.js";
import { create_editor } from './editor.js';
const editor_config = {
    matchBrackets: "always",
    fontSize: 13,
    language: 'javascript',
    inlineSuggest: { enabled: false },
    quickSuggestions: false,
    minimap: {
        enabled: false
    },
    fontFamily: 'CMU Typewriter Text',
    tabSize: 2,
    insertSpaces: true,
    automaticLayout: true
};
export const add_script_editor = (text) => {
    const input = html_element('div', function () {
        this.style.height = '70%';
    }, []);
    const editor = create_editor(input, editor_config);
    const model = editor.getModel();
    if (!model) {
        throw new Error("No text model in script editor.");
    }
    if (text) {
        model.setValue(text);
    }
    const print = (s) => {
        output.appendChild(text_node(s));
    };
    const run = async () => {
        output.innerHTML = '';
        try {
            await ui.run_script(model.getValue(), print);
        }
        catch (e) {
            output.appendChild(html_element('div', function () {
                this.style.borderColor = 'white';
                this.style.borderStyle = 'solid';
                this.style.borderWidth = '1px';
                this.style.marginTop = '4px';
                this.style.marginBottom = '4px';
                this.style.marginLeft = '8px';
                this.style.marginRight = '8px';
                this.style.padding = '8px';
            }, [
                text_node(e instanceof Error ? e.message : 'An unknown exception occurred.')
            ]));
        }
    };
    input.addEventListener('keydown', async (e) => {
        if (e.key === 'F4') {
            await run();
        }
    });
    const output = html_element('div', function () {
        this.style.whiteSpace = "pre-wrap";
        this.style.overflowWrap = "break-word";
        this.style.overflowX = "hidden";
        this.style.overflowY = "scroll";
        this.style.wordBreak = "break-all";
        this.style.borderTopColor = 'white';
        this.style.borderTopStyle = 'solid';
        this.style.borderTopWidth = '1px';
        this.style.whiteSpace = 'pre-wrap';
        this.style.wordBreak = 'anywhere';
        this.style.flexGrow = '1';
        this.style.flexShrink = '1';
    }, []);
    const all = html_element('div', function () {
        this.style.height = '100%';
        this.style.display = 'flex';
        this.style.flexDirection = 'column';
        this.addEventListener('pointerdown', e => {
            if (e.button === 2) {
                ui.context_menu(e.clientX, e.clientY, [{
                        type: 'text',
                        label: 'Run',
                        handler: run
                    }]);
            }
        });
    }, [
        input,
        output
    ]);
    const [pane, user] = ui.create_pane(all);
    pane.set_title(`Script Editor`);
    return user;
};
//# sourceMappingURL=script_editor.js.map