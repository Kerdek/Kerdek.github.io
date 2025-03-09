import { typ_ref } from "./graph.js";
import { rename } from "./rename.js";
function* idGenerator() {
    let current = 0;
    while (true) {
        yield convertToBase26(current++);
    }
}
function convertToBase26(num) {
    let result = '';
    while (num >= 0) {
        result = String.fromCharCode((num % 26) + 97) + result; // 97 is the ASCII code for 'a'
        num = Math.floor(num / 26) - 1; // Adjust for zero-based index
    }
    return result;
}
export const pretty_vars = t => rename((() => { let ids = idGenerator(); return () => typ_ref(ids.next().value); })(), t, {});
//# sourceMappingURL=pretty_vars.js.map