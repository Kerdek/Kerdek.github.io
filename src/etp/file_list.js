import { download, elm } from '../common/util/dom.js';
import { create_pane } from '../common/panes/pane.js';
import { files, files_changed, valid_filename, add_files_changed_listener, remove_files_changed_listener } from './fs.js';
import { yes_no, alert, prompt_filename } from '../common/panes/prompts.js';
import { add_script_editor } from './script_editor.js';
import { button, menu_bar, context_menu } from '../common/panes/ui.js';
import { assign, mod } from '../common/util/di.js';
export const add_file_list = () => {
    const menu = menu_bar([{
            label: 'File',
            tip: 'Actions on the files',
            items: [{
                    type: 'text',
                    label: 'New',
                    tip: 'Create a new file',
                    handler: async () => {
                        const name = await prompt_filename('');
                        if (name) {
                            if (name in files) {
                                alert('Error', 'Rename: File already exists.');
                                return;
                            }
                            files[name] = {
                                contents: ''
                            };
                            files_changed();
                        }
                    }
                },
                { type: 'separator' }, {
                    type: 'text',
                    label: 'Import Files',
                    tip: 'Import files from your computer',
                    handler: () => {
                        let input = document.createElement('input');
                        input.toggleAttribute('multiple');
                        input.type = 'file';
                        input.onchange = async () => {
                            let inputs = input.files;
                            if (!inputs) {
                                return;
                            }
                            for (let i = 0; i < inputs.length; i++) {
                                const input = inputs[i];
                                if (!valid_filename(input.name)) {
                                    await alert('Error', `Import: Invalid file name: ${input.name}`);
                                    return;
                                }
                            }
                            for (let i = 0; i < inputs.length; i++) {
                                const input = inputs[i];
                                const contents = await input.text();
                                files[input.name] = {
                                    contents
                                };
                            }
                            files_changed();
                        };
                        input.click();
                    }
                },
                {
                    type: 'separator'
                },
                {
                    type: 'text',
                    label: 'Export All',
                    tip: 'Save a copy of every file to your computer',
                    handler: () => {
                        for (const name in files) {
                            const file = files[name];
                            if (file) {
                                download(name, file.contents);
                            }
                        }
                    }
                }]
        }]);
    const update = () => {
        const item = (label) => mod(button(label), e => {
            const delete_file = async () => {
                if (await yes_no('Confirm', `Delete File?\n\n${label}`)) {
                    delete files[label];
                    files_changed();
                }
            };
            const rename_file = async () => {
                const name = await prompt_filename(label);
                if (name) {
                    if (name in files) {
                        alert('Error', 'Rename: File already exists.');
                        return;
                    }
                    const file = files[label];
                    if (file === undefined) {
                        alert('Error', 'Rename: File no longer exists.');
                        return;
                    }
                    else {
                        files[name] = file;
                        delete files[label];
                        files_changed();
                    }
                }
            };
            assign(e.style, {
                border: 'none',
                justifyContent: 'start'
            });
            e.addEventListener('click', () => {
                const file = files[label];
                if (file) {
                    add_script_editor(file.contents, label);
                }
            });
            context_menu(e, () => [
                { type: 'text', label: 'Rename', tip: 'Change the file\'s name', handler: rename_file },
                { type: 'text', label: 'Delete', tip: 'Delete the file permanently', handler: delete_file }
            ]);
        });
        const list = mod(elm('div'), e => {
            e.append(...Object.keys(files).sort().map(item));
        });
        content.innerHTML = '';
        content.appendChild(list);
    };
    const content = mod(elm('div'), e => assign(e.style, {
        position: 'absolute',
        inset: '0',
        overflowY: 'scroll'
    }));
    const all = mod(elm('div'), e => {
        assign(e.style, {
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
        });
        e.append(menu, mod(elm('div'), e => {
            assign(e.style, {
                flex: '1 1 0',
                position: 'relative'
            });
            e.append(content);
        }));
    });
    update();
    const pane = create_pane(all);
    pane.set_title('File List');
    add_files_changed_listener(update);
    pane.add_close_handler(() => {
        remove_files_changed_listener(update);
    });
};
//# sourceMappingURL=file_list.js.map