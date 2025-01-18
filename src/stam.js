import { homproc } from "./run.js";
export const stam = visit => root => homproc((call, cc, ret) => {
    const rec = (code, cont) => call(v(code), cont);
    const rc = code => cc(v(code));
    const v = visit(rec, rc, ret);
    return () => root(rec, rc, ret);
});
//# sourceMappingURL=stam.js.map