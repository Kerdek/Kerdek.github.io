import { download, elm, txt } from '../common/util/dom.js';
import { create_editor } from './editor.js';
import { create_pane } from '../common/panes/pane.js';
import { files, files_changed } from './fs.js';
import { left_border, list_item, menu_bar, top_border } from '../common/panes/ui.js';
import { assign, lookup, mod } from '../common/util/di.js';
import { prompt_filename } from '../common/panes/prompts.js';
import { get_model_data } from './language_server.js';
import { html_format, print_goal, print_messages } from './print.js';
import { select_statement } from './select.js';
import { position_from_monaco } from './monaco_range.js';
const { keys } = Object;
export const add_script_editor = (text, name) => {
    const input = mod(elm('div'), e => {
        assign(e.style, {
            userSelect: 'none',
            position: 'absolute',
            inset: '0'
        });
    }), editor = create_editor(input), model = editor.getModel();
    if (!model) {
        return;
    }
    const refresh_title = () => {
        pane.set_title(`Script Editor ${current_filename ? `(${current_filename})` : `[new file]`}`);
    }, save = () => {
        if (!current_filename) {
            save_as();
        }
        else {
            files[current_filename] = {
                contents: model.getValue()
            };
            files_changed();
        }
    }, save_as = async () => {
        const name = await prompt_filename(current_filename || '');
        if (name) {
            current_filename = name;
            refresh_title();
            save();
        }
    }, open = () => {
        const item = (label, handler) => mod(list_item(label), e => {
            e.addEventListener('click', handler);
        }), put_back = () => {
            all.appendChild(content);
            all.removeChild(list);
        }, list = mod(elm('div'), e => {
            e.append(item('..', put_back), ...keys(files).sort().map(name => item(name, () => {
                const file = files[name];
                model.setValue(file ? file.contents : '');
                current_filename = name;
                refresh_title();
                put_back();
            })));
        });
        all.removeChild(content);
        all.append(list);
    }, expor = () => {
        download(current_filename || 'script.st', model.getValue());
    }, ne = () => {
        current_filename = undefined;
        refresh_title();
        model.setValue('');
    };
    let sched = false, good = true;
    const schedule_refresh_goals = () => {
        if (sched) {
            return;
        }
        sched = true;
        good = false;
        window.setTimeout(() => {
            sched = false;
            if (good) {
                return;
            }
            refresh_goals();
        }, 300);
    }, refresh_goals = () => {
        good = true;
        goals.innerHTML = '';
        const c = data.cache();
        const pos = editor.getPosition();
        if (pos && c.abstract) {
            const w = position_from_monaco(pos);
            const s = select_statement(w, false)(c.abstract);
            if (s && s.k === 'proof') {
                const g = lookup(c.proof_transcript, s.e);
                if (g) {
                    goals.append(...print_goal(html_format)(g));
                }
            }
        }
    }, menu = menu_bar([
        { label: 'File', tip: 'Actions on the file', items: [
                { type: 'text', label: 'New', tip: 'Clear the buffer', handler: ne },
                { type: 'separator' },
                { type: 'text', label: 'Open...', tip: 'Open file chooser', handler: open },
                { type: 'separator' },
                { type: 'text', label: 'Save', tip: 'Save the buffer', handler: save },
                { type: 'text', label: 'Save As...', tip: 'Save the buffer with a specific name', handler: save_as },
                { type: 'separator' },
                { type: 'text', label: 'Export a Copy', tip: 'Save a copy of the script to your computer', handler: expor }
            ] }
    ]), output = mod(elm('div'), e => {
        assign(e.style, {
            position: 'absolute',
            inset: '0',
            cursor: 'text',
            overflowX: 'hidden',
            overflowY: 'scroll',
        });
    }), goals = mod(elm('div'), e => {
        assign(e.style, {
            position: 'absolute',
            inset: '0',
            cursor: 'text',
            margin: '1ch',
            overflowX: 'hidden',
            overflowY: 'scroll',
        });
    }), content = mod(elm('div'), e => {
        assign(e.style, {
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
        });
        e.append(menu, mod(elm('div'), e => {
            assign(e.style, {
                flex: '1 1 0',
                display: 'flex',
                flexDirection: 'column'
            });
            e.append(mod(elm('div'), e => {
                assign(e.style, {
                    flex: '1 1 0',
                    display: 'flex',
                    flexDirection: 'row'
                });
                e.append(mod(elm('div'), e => {
                    assign(e.style, {
                        flex: '1 1 0',
                        position: 'relative'
                    });
                    e.append(input);
                }), mod(elm('div'), e => {
                    assign(e.style, {
                        width: '30%',
                        position: 'relative',
                        ...left_border
                    });
                    e.append(goals);
                }));
            }), mod(elm('div'), e => {
                assign(e.style, {
                    height: '30%',
                    position: 'relative',
                    ...top_border
                });
                e.append(output);
            }));
        }));
    }), all = mod(elm('div'), e => {
        assign(e.style, {
            height: '100%'
        });
        e.append(content);
    });
    const data = get_model_data(model);
    data.add_change_listener(() => {
        const c = data.cache();
        const m = c.messages;
        output.innerHTML = '';
        output.append(...m.length === 0 ? [
            mod(elm('div'), e => {
                assign(e, {
                    title: 'No messages.'
                });
                assign(e.style, {
                    fontSize: '40pt',
                    padding: '6pt'
                });
                e.append(txt("👍"));
            })
        ] :
            print_messages(m, w => {
                if ('begin' in w) {
                    const p = {
                        startLineNumber: w.begin.line,
                        startColumn: w.begin.col,
                        endLineNumber: w.end.line,
                        endColumn: w.end.col
                    };
                    editor.revealRange(p);
                    editor.setSelection(p);
                }
                else {
                    const p = {
                        lineNumber: w.line,
                        column: w.col
                    };
                    editor.revealPosition(p);
                    editor.setPosition(p);
                }
                editor.focus();
            }));
    });
    editor.onDidChangeModelContent(schedule_refresh_goals);
    editor.onDidChangeCursorPosition(schedule_refresh_goals);
    if (text) {
        model.setValue(text);
    }
    let current_filename = name;
    const pane = create_pane(all);
    refresh_title();
};
//# sourceMappingURL=script_editor.js.map