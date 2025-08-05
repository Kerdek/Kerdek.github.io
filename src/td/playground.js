import { html_element, pointer_hold, text_node } from './scripts/dom.js';
onbeforeunload = () => true;
document.title = 'Four';
addEventListener('contextmenu', e => {
    e.stopPropagation();
    e.preventDefault();
    return false;
}, true);
const style_rule = (() => {
    const style = document.head.appendChild(document.createElement('style'));
    const ss = style.sheet;
    return ss ? x => ss.insertRule(x, 0) : () => -1;
})();
style_rule(`html {
width: 100%;
height: 100%; }`);
style_rule(`body {
height: 100%;
margin: 0;
padding: 0;
font-size: 13px;
background: black;
overflow: hidden;
color: white;
caret-color: white; }`);
export const create_button = (text, mod) => html_element('div', function () {
    this.style.userSelect = "none";
    this.style.whiteSpace = "pre";
    this.style.display = "flex";
    this.style.justifyContent = "center";
    this.style.alignItems = "center";
    this.style.overflow = "hidden";
    this.style.borderStyle = "solid";
    this.style.borderWidth = "1px";
    this.style.borderColor = "white";
    this.style.height = '18px';
    this.style.paddingLeft = '8px';
    this.style.paddingRight = '8px';
    this.style.cursor = "pointer";
    this.tabIndex = 0;
    this.addEventListener('mouseenter', () => {
        this.style.background = "white";
        this.style.color = "black";
    });
    this.addEventListener('mouseleave', () => {
        this.style.removeProperty("background");
        this.style.removeProperty("color");
    });
    mod.apply(this);
}, [
    text_node(text)
]);
export const create_textbox = (text, mod) => html_element('div', function () {
    this.toggleAttribute('contenteditable');
    this.style.whiteSpace = "pre";
    this.style.display = "inline-flex";
    this.style.justifyContent = "start";
    this.style.alignItems = "center";
    this.style.overflow = "scroll";
    this.style.borderStyle = "solid";
    this.style.borderWidth = "1px";
    this.style.borderColor = "white";
    this.style.height = '18px';
    this.style.paddingLeft = '8px';
    this.style.paddingRight = '8px';
    this.style.cursor = 'text';
    this.tabIndex = 0;
    mod.apply(this);
}, [
    text_node(text), html_element('br', function () { }, [])
]);
let context_menu_element;
export const context_menu = (x, y, items) => {
    if (context_menu_element) {
        document.body.removeChild(context_menu_element);
    }
    const elems = [];
    for (const item of items) {
        elems.push(item.type === 'separator' ?
            html_element('div', function () {
                this.style.height = '1px';
                this.style.background = 'white';
                this.style.marginLeft = '8px';
                this.style.marginRight = '8px';
            }, []) :
            item.type === 'text' ?
                html_element('div', function () {
                    this.style.userSelect = "none";
                    this.style.display = "flex";
                    this.style.justifyContent = "start";
                    this.style.alignItems = "center";
                    this.style.height = '18px';
                    this.style.margin = '1px';
                    this.style.paddingLeft = '8px';
                    this.style.paddingRight = '8px';
                    this.style.cursor = "pointer";
                    this.addEventListener('click', e => {
                        if (e.button === 0) {
                            item.handler();
                        }
                    });
                    this.addEventListener('mouseenter', () => {
                        this.style.background = "white";
                        this.style.color = "black";
                    });
                    this.addEventListener('mouseleave', () => {
                        this.style.removeProperty("background");
                        this.style.removeProperty("color");
                    });
                }, [
                    text_node(item.label)
                ]) :
                item);
    }
    context_menu_element = html_element('div', function () {
        this.style.zIndex = '2';
        this.style.background = 'black';
        this.style.borderStyle = "solid";
        this.style.borderWidth = "1px";
        this.style.borderColor = "white";
        this.style.position = 'absolute';
        this.style.overflow = 'hidden';
    }, elems);
    document.body.appendChild(context_menu_element);
    context_menu_element.style.left = `${x + context_menu_element.offsetWidth > document.body.offsetWidth ? x - context_menu_element.offsetWidth : x}px`;
    context_menu_element.style.top = `${y + context_menu_element.offsetHeight > document.body.offsetHeight ? y - context_menu_element.offsetHeight : y}px`;
    const click = () => {
        if (context_menu_element) {
            document.body.removeChild(context_menu_element);
            context_menu_element = undefined;
        }
        removeEventListener('click', click, true);
    };
    addEventListener('click', click, true);
};
const panes = [];
const closers = new Set();
const activate = (p) => {
    const i = parseInt(p.style.zIndex);
    for (const pane of panes) {
        const j = parseInt(pane.style.zIndex);
        if (j > i) {
            pane.style.zIndex = `${j - 1}`;
        }
    }
    p.style.zIndex = `${panes.length - 1}`;
};
let pane_spawn = 100;
const create_pane = (element, options) => {
    if (pane_spawn > document.body.clientHeight - 100) {
        pane_spawn -= document.body.clientHeight - 200;
    }
    let pos = [pane_spawn, pane_spawn];
    let size = options?.size || [700, 700];
    pane_spawn += 100;
    const close_handlers = new Set();
    const close = () => {
        for (const handler of close_handlers) {
            handler();
        }
        const i = panes.indexOf(all);
        if (i !== -1) {
            panes.splice(i, 1);
        }
        closers.delete(close);
        document.body.removeChild(all);
    };
    const title_text = text_node('');
    const title_text_box = html_element('div', function () {
        this.style.whiteSpace = "pre";
        this.style.height = "100%";
        this.style.display = "flex";
        this.style.justifyContent = "center";
        this.style.alignItems = "center";
        this.style.flexGrow = "1";
        this.style.flexShrink = "1";
        this.style.flexBasis = "0";
        this.style.overflow = "hidden";
        this.addEventListener('pointerdown', async (e) => {
            if (e.button === 0) {
                const drag_start = [e.screenX, e.screenY];
                const pos_start = [...pos];
                pointer_hold(this, 0, e.pointerId, false, e => {
                    pos[0] = pos_start[0] + e.screenX - drag_start[0];
                    pos[0] = Math.min(pos[0], document.body.scrollWidth - 100);
                    pos[0] = Math.max(pos[0], 100 - size[0]);
                    pos[1] = pos_start[1] + e.screenY - drag_start[1];
                    pos[1] = Math.min(pos[1], document.body.scrollHeight - 100);
                    pos[1] = Math.max(pos[1], 0);
                    all.style.left = `${pos[0]}px`;
                    all.style.top = `${pos[1]}px`;
                });
            }
            else if (e.button === 2) {
                context_menu(e.clientX, e.clientY, [{
                        type: 'text',
                        label: 'Close',
                        handler: () => {
                            close();
                        }
                    }]);
            }
        });
    }, [
        title_text
    ]);
    const resize_button = () => create_button("⤢", function () {
        this.style.margin = '1px';
        this.addEventListener('pointerdown', async (e) => {
            if (e.button === 0) {
                const drag_start = [e.screenX, e.screenY];
                const pos_start = [...pos];
                const size_start = [...size];
                pointer_hold(this, 0, e.pointerId, false, e => {
                    if (drag_start) {
                        size[0] = size_start[0] + e.screenX - drag_start[0];
                        size[0] = Math.max(size[0], title_button_area.offsetWidth + 4);
                        size[0] = Math.max(size[0], 100 - pos_start[0]);
                        size[1] = size_start[1] + drag_start[1] - e.screenY;
                        size[1] = Math.max(size[1], title_button_area.offsetHeight + 4);
                        size[1] = Math.max(size[1], size_start[1] + 100 + pos_start[1] - document.body.scrollHeight);
                        size[1] = Math.min(size[1], size_start[1] + pos_start[1]);
                        pos[1] = pos_start[1] + size_start[1] - size[1];
                        all.style.top = `${pos[1]}px`;
                        all.style.width = `${size[0] - 2}px`;
                        all.style.height = `${size[1] - 2}px`;
                    }
                });
            }
        });
    });
    const close_button = create_button("✕", function () {
        this.style.margin = '1px';
        this.addEventListener("click", () => {
            close();
        });
    });
    const title_button_area = html_element('div', function () {
        this.style.display = "flex";
        this.style.flexDirection = "row";
        this.style.flexBasis = "auto";
        this.style.flexGrow = "0";
        this.style.flexShrink = "0";
    }, [
        ...!options || !('user_size' in options) || options.user_size ? [resize_button()] : [],
        close_button
    ]);
    const titlebar = html_element('div', function () {
        this.style.userSelect = "none";
        this.style.borderBottomStyle = "solid";
        this.style.borderBottomWidth = "1px";
        this.style.borderBottomColor = "white";
        this.style.alignItems = "center";
        this.style.display = "flex";
        this.style.padding = '1px';
        this.style.flexDirection = "row";
        this.style.flexGrow = "0";
        this.style.flexShrink = "0";
        this.style.flexBasis = "auto";
    }, [
        title_text_box,
        title_button_area
    ]);
    const contents_box = html_element('div', function () {
        this.style.flexGrow = "1";
        this.style.flexShrink = "0";
        this.style.flexBasis = "0";
        this.style.overflow = "hidden";
    }, [
        element
    ]);
    const all = html_element('div', function () {
        this.style.background = "black";
        this.style.borderStyle = "solid";
        this.style.borderWidth = "1px";
        this.style.borderColor = "white";
        this.style.display = "flex";
        this.style.flexDirection = "column";
        this.style.position = "absolute";
        this.style.left = `${pos[0]}px`;
        this.style.top = `${pos[1]}px`;
        this.style.width = `${size[0] - 2}px`;
        this.style.height = `${size[1] - 2}px`;
        this.style.overflow = "hidden";
        this.style.zIndex = `${panes.length}`;
        this.addEventListener('mousedown', () => {
            activate(this);
        });
    }, [
        titlebar,
        contents_box
    ]);
    panes.push(all);
    closers.add(close);
    document.body.appendChild(all);
    if (options?.auto_size) {
        size = [element.offsetWidth + 2, element.offsetHeight + 26];
        all.style.width = `${size[0] - 2}px`;
        all.style.height = `${size[1] - 2}px`;
    }
    activate(all);
    return [{
            client_width() {
                return size[0] - 2;
            },
            client_height() {
                return size[1] - 26;
            },
            add_close_handler: handler => {
                close_handlers.add(handler);
            },
            remove_close_handler: handler => {
                close_handlers.delete(handler);
            },
            close,
            set_title: title => {
                title_text.data = title;
            }
        },
        {
            offset_width() {
                return size[0];
            },
            offset_height() {
                return size[1];
            },
            close
        }];
};
let scene_changed_handlers = new Set();
export const add_scene_changed_handler = (handler) => {
    scene_changed_handlers.add(handler);
};
export const remove_scene_changed_handler = (handler) => {
    scene_changed_handlers.delete(handler);
};
export const scene_changed = () => {
    for (const handler of scene_changed_handlers) {
        handler();
    }
};
const prompt = async (title) => new Promise(c => {
    const ok = () => {
        pane.close();
        c(box.innerText);
    };
    const box = create_textbox('', function () {
        this.style.margin = '4px';
        this.style.flexGrow = '1';
        this.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                ok();
            }
        });
    });
    const [pane, _user] = create_pane(html_element('div', function () {
        this.style.padding = '4px';
        this.style.display = 'flex';
        this.style.flexDirection = 'row';
    }, [
        box,
        create_button('Ok', function () {
            this.style.margin = '4px';
            this.addEventListener('click', ok);
        })
    ]), {
        user_size: false,
        auto_size: true
    });
    pane.set_title(title);
    box.focus();
});
const pane_menu_list = [];
const add_menu_pane = (desc) => {
    pane_menu_list.push(desc);
};
document.body.appendChild(html_element('div', function () { }, [create_button('Pane', function () {
        this.style.margin = '1px';
        this.style.display = 'inline-flex';
        this.addEventListener('click', () => {
            context_menu(this.offsetLeft, this.offsetTop + this.offsetHeight, pane_menu_list.map(item => ({
                type: 'text',
                label: item.name,
                handler: item.handler
            })));
        });
    })]));
const AsyncFunction = async function () { }.constructor;
const run_script = async (text, print) => await AsyncFunction("out", text)(print);
const ui = Object.create(null);
Object.defineProperty(self, 'ui', { value: ui });
Object.defineProperty(ui, 'create_pane', { value: create_pane });
Object.defineProperty(ui, 'create_button', { value: create_button });
Object.defineProperty(ui, 'create_textbox', { value: create_textbox });
Object.defineProperty(ui, 'context_menu', { value: context_menu });
Object.defineProperty(ui, 'add_menu_pane', { value: add_menu_pane });
Object.defineProperty(ui, 'run_script', { value: run_script });
Object.freeze(ui);
await run_script(`await import('./scripts/start.js')`, (s) => console.log(s));
//# sourceMappingURL=playground.js.map