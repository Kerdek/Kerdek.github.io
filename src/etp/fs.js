export const valid_filename = (name) => /^[^\0\/]+$/.test(name) && name !== '.' && name !== '..';
export const files = (() => {
    const text = localStorage.getItem('semity_files');
    return text ? JSON.parse(text) : {};
})();
const files_changed_listeners = new Set();
export const add_files_changed_listener = (handler) => {
    files_changed_listeners.add(handler);
};
export const remove_files_changed_listener = (handler) => {
    files_changed_listeners.delete(handler);
};
export const files_changed = () => {
    localStorage.setItem('semity_files', JSON.stringify(files));
    for (const handler of files_changed_listeners) {
        handler();
    }
};
//# sourceMappingURL=fs.js.map