import { valid_filename } from '../../etp/fs.js';
import { assign, mod } from '../util/di.js';
import { elm, txt } from '../util/dom.js';
import { create_pane } from './pane.js';
import { button, text_box } from './ui.js';
export const prompt = async (title, suggest) => new Promise(c => {
    let value = undefined;
    const ok = () => {
        value = node.data;
        pane.close();
    };
    const [node, box] = mod(text_box(suggest), ([, e]) => {
        assign(e.style, {
            margin: '4px',
            flexGrow: '1'
        });
        e.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                ok();
                return false;
            }
            return true;
        });
    });
    const pane = create_pane(mod(elm('div'), e => {
        assign(e.style, {
            padding: '20px',
            display: 'flex',
            flexDirection: 'row'
        });
        e.append(box, mod(button('Ok'), e => {
            e.style.margin = '4px';
            e.addEventListener('click', ok);
        }));
    }), {
        user_size: false,
        auto_size: true
    });
    pane.set_title(title);
    pane.add_close_handler(() => {
        c(value);
    });
    box.focus();
});
export const alert = async (title, text) => new Promise(c => {
    const box = mod(elm('div'), e => {
        e.style.margin = '4px';
        e.append(txt(text));
    });
    const pane = create_pane(mod(elm('div'), e => {
        assign(e.style, {
            whiteSpace: 'pre',
            padding: '4px',
            display: 'inline-flex',
            flexDirection: 'column'
        });
        e.append(box, mod(elm('div'), e => {
            assign(e.style, {
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center'
            });
            e.append(mod(button('Ok'), e => {
                e.style.margin = '4px';
                e.addEventListener('click', () => {
                    pane.close();
                });
            }));
        }));
    }), {
        user_size: false,
        auto_size: true
    });
    pane.set_title(title);
    pane.add_close_handler(() => {
        c();
    });
    box.focus();
});
export const yes_no = async (title, text) => new Promise(c => {
    let value = false;
    const box = mod(elm('div'), e => {
        e.style.margin = '20px';
        e.append(txt(text));
    });
    const pane = create_pane(mod(elm('div'), e => {
        assign(e.style, {
            whiteSpace: 'pre',
            padding: '4px',
            display: 'inline-flex',
            flexDirection: 'column'
        });
        e.append(box, mod(elm('div'), e => {
            assign(e.style, {
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center'
            });
            e.append(mod(button('Yes'), e => {
                e.style.margin = '4px';
                e.addEventListener('click', () => {
                    value = true;
                    pane.close();
                });
            }), mod(button('No'), e => {
                e.style.margin = '4px';
                e.addEventListener('click', () => {
                    pane.close();
                });
            }));
        }));
    }), {
        user_size: false,
        auto_size: true
    });
    pane.set_title(title);
    pane.add_close_handler(() => {
        c(value);
    });
    box.focus();
}), prompt_filename = async (name) => {
    const new_name = await prompt('Enter File Name', name);
    if (new_name === undefined) {
        return undefined;
    }
    if (!valid_filename(new_name)) {
        await alert('Error', `Invalid file name entered: ${new_name}`);
        return undefined;
    }
    return new_name;
};
//# sourceMappingURL=prompts.js.map