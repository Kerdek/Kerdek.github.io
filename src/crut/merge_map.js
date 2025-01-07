import { typ_cnj } from "./graph.js";
export const merge_map = (l, r) => {
    const o = { ...l };
    for (const k in r) {
        if (k in o) {
            o[k] = typ_cnj(r[k], o[k]);
        }
        else {
            o[k] = r[k];
        }
    }
    return o;
};
//# sourceMappingURL=merge_map.js.map