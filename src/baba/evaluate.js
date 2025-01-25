export const exec = (all, print) => {
    const enumerate_expr = (expr, m) => expr.kind === "call" ? (enumerate_expr(expr.dest, m), expr.opers.forEach(oper => enumerate_expr(oper, m))) :
        expr.kind === "neg" ||
            expr.kind === "not" ? enumerate_expr(expr.oper, m) :
            expr.kind === "access" ||
                expr.kind === "assign" ||
                expr.kind === "assignadd" ||
                expr.kind === "assignsub" ||
                expr.kind === "assignmul" ||
                expr.kind === "assigndiv" ||
                expr.kind === "assignmod" ||
                expr.kind === "comma" ||
                expr.kind === "ee" ||
                expr.kind === "ne" ||
                expr.kind === "gt" ||
                expr.kind === "ge" ||
                expr.kind === "lt" ||
                expr.kind === "le" ||
                expr.kind === "add" ||
                expr.kind === "sub" ||
                expr.kind === "mul" ||
                expr.kind === "div" ||
                expr.kind === "mod" ? (enumerate_expr(expr.lhs, m), enumerate_expr(expr.rhs, m)) :
                expr.kind === "list" ? (expr.opers.forEach(oper => enumerate_expr(oper, m))) :
                    expr.kind === "ref" ? m.has(expr.id) ? void 0 : m.set(expr.id, { kind: "lit", value: null }) :
                        void 0;
    const enumerate_stmt = (stmt, m) => stmt.kind == "function" ? enumerate_expr(stmt.name, m) :
        stmt.kind == "if" ? (enumerate_expr(stmt.cond, m), enumerate_stmts(stmt.then, m)) :
            stmt.kind == "ifelse" ? (enumerate_expr(stmt.cond, m), enumerate_stmts(stmt.then, m), Array.isArray(stmt.else) ? enumerate_stmts(stmt.else, m) : enumerate_stmt(stmt.else, m)) :
                stmt.kind == "while" ? (enumerate_expr(stmt.cond, m), enumerate_stmts(stmt.body, m)) :
                    stmt.kind == "dowhile" ? (enumerate_stmts(stmt.body, m), enumerate_expr(stmt.cond, m)) :
                        stmt.kind == "for" ? (stmt.conds.forEach(cond => enumerate_expr(cond, m)), enumerate_stmts(stmt.body, m)) :
                            stmt.kind == "forin" ? (enumerate_expr(stmt.range, m), enumerate_stmts(stmt.body, m)) :
                                stmt.kind == "return" ? enumerate_expr(stmt.oper, m) :
                                    stmt.kind == "expr" ? enumerate_expr(stmt.expr, m) :
                                        void 0;
    const enumerate_stmts = (stmts, m) => stmts.forEach(stmt => enumerate_stmt(stmt, m));
    const reduce_expr = (expr, m) => expr.kind === "call" ? { kind: "call", dest: reduce_expr(expr.dest, m), opers: expr.opers.map(oper => reduce_expr(oper, m)) } :
        expr.kind === "pos" ||
            expr.kind === "neg" ||
            expr.kind === "not" ||
            expr.kind === "bitcmp" ? { kind: expr.kind, oper: reduce_expr(expr.oper, m) } :
            expr.kind === "access" ||
                expr.kind === "assign" ||
                expr.kind === "assignadd" ||
                expr.kind === "assignsub" ||
                expr.kind === "assignmul" ||
                expr.kind === "assigndiv" ||
                expr.kind === "assignmod" ||
                expr.kind === "assignshl" ||
                expr.kind === "assignshr" ||
                expr.kind === "assignbitand" ||
                expr.kind === "assignbitxor" ||
                expr.kind === "assignbitor" ||
                expr.kind === "assignlogand" ||
                expr.kind === "assignlogor" ||
                expr.kind === "comma" ||
                expr.kind === "ee" ||
                expr.kind === "ne" ||
                expr.kind === "gt" ||
                expr.kind === "ge" ||
                expr.kind === "lt" ||
                expr.kind === "le" ||
                expr.kind === "add" ||
                expr.kind === "sub" ||
                expr.kind === "mul" ||
                expr.kind === "div" ||
                expr.kind === "mod" ||
                expr.kind === "shl" ||
                expr.kind === "shr" ||
                expr.kind === "bitand" ||
                expr.kind === "bitxor" ||
                expr.kind === "bitor" ||
                expr.kind === "logand" ||
                expr.kind === "logor" ? { kind: expr.kind, lhs: reduce_expr(expr.lhs, m), rhs: reduce_expr(expr.rhs, m) } :
                expr.kind === "list" ? { kind: "list", opers: expr.opers.map(oper => reduce_expr(oper, m)) } :
                    expr.kind === "ref" && m.has(expr.id) ? m.get(expr.id) :
                        expr;
    const reduce_stmt = (stmt, m) => stmt.kind == "function" ? (() => {
        const mp = new Map(m);
        for (const param of stmt.params) {
            mp.delete(param);
        }
        return { kind: "function", name: reduce_expr(stmt.name, m), params: stmt.params, body: reduce_stmts(stmt.body, mp) };
    })() :
        stmt.kind === "if" ? { kind: "if", cond: reduce_expr(stmt.cond, m), then: reduce_stmts(stmt.then, m) } :
            stmt.kind === "ifelse" ? { kind: "ifelse", cond: reduce_expr(stmt.cond, m), then: reduce_stmts(stmt.then, m), else: Array.isArray(stmt.else) ? reduce_stmts(stmt.else, m) : reduce_stmt(stmt.else, m) } :
                stmt.kind === "while" ? { kind: "while", cond: reduce_expr(stmt.cond, m), body: reduce_stmts(stmt.body, m) } :
                    stmt.kind === "dowhile" ? { kind: "dowhile", cond: reduce_expr(stmt.cond, m), body: reduce_stmts(stmt.body, m) } :
                        stmt.kind === "for" ? { kind: "for", conds: stmt.conds.map(cond => reduce_expr(cond, m)), body: reduce_stmts(stmt.body, m) } :
                            stmt.kind === "forin" ? { kind: "forin", lhs: reduce_expr(stmt.lhs, m), range: reduce_expr(stmt.range, m), body: reduce_stmts(stmt.body, m) } :
                                stmt.kind === "return" ? { kind: "return", oper: reduce_expr(stmt.oper, m) } :
                                    stmt.kind === "expr" ? { kind: "expr", expr: reduce_expr(stmt.expr, m) } :
                                        stmt;
    const reduce_stmts = (stmts, m) => stmts.map(stmt => reduce_stmt(stmt, m));
    const evaluate_expr = expr => expr.kind === "lit" ? expr : ({ kind: "lit", value: expr.kind === "call" ? (() => {
            const dest = evaluate_expr(expr.dest).value;
            return dest(...expr.opers.map(oper => evaluate_expr(oper).value));
        })() :
            expr.kind === "access" ? (() => evaluate_expr(expr.lhs).value[evaluate_expr(expr.rhs).value])() :
                expr.kind === "assign" ? (() => evaluate_expr(expr.lhs).value = evaluate_expr(expr.rhs).value)() :
                    expr.kind === "assignadd" ? (() => evaluate_expr(expr.lhs).value += evaluate_expr(expr.rhs).value)() :
                        expr.kind === "assignsub" ? (() => evaluate_expr(expr.lhs).value -= evaluate_expr(expr.rhs).value)() :
                            expr.kind === "assignmul" ? (() => evaluate_expr(expr.lhs).value *= evaluate_expr(expr.rhs).value)() :
                                expr.kind === "assigndiv" ? (() => evaluate_expr(expr.lhs).value /= evaluate_expr(expr.rhs).value)() :
                                    expr.kind === "assignmod" ? (() => evaluate_expr(expr.lhs).value %= evaluate_expr(expr.rhs).value)() :
                                        expr.kind === "assignshr" ? (() => evaluate_expr(expr.lhs).value >>= evaluate_expr(expr.rhs).value)() :
                                            expr.kind === "assignshl" ? (() => evaluate_expr(expr.lhs).value <<= evaluate_expr(expr.rhs).value)() :
                                                expr.kind === "assignbitand" ? (() => evaluate_expr(expr.lhs).value &= evaluate_expr(expr.rhs).value)() :
                                                    expr.kind === "assignbitor" ? (() => evaluate_expr(expr.lhs).value |= evaluate_expr(expr.rhs).value)() :
                                                        expr.kind === "assignbitxor" ? (() => evaluate_expr(expr.lhs).value ^= evaluate_expr(expr.rhs).value)() :
                                                            expr.kind === "assignlogand" ? (() => evaluate_expr(expr.lhs).value &&= evaluate_expr(expr.rhs).value)() :
                                                                expr.kind === "assignlogor" ? (() => evaluate_expr(expr.lhs).value ||= evaluate_expr(expr.rhs).value)() :
                                                                    expr.kind === "comma" ? (() => (evaluate_expr(expr.lhs).value, evaluate_expr(expr.rhs).value))() :
                                                                        expr.kind === "pos" ? (() => +evaluate_expr(expr.oper).value)() :
                                                                            expr.kind === "neg" ? (() => -evaluate_expr(expr.oper).value)() :
                                                                                expr.kind === "not" ? (() => !evaluate_expr(expr.oper).value)() :
                                                                                    expr.kind === "bitcmp" ? (() => ~evaluate_expr(expr.oper).value)() :
                                                                                        expr.kind === "ee" ? (() => evaluate_expr(expr.lhs).value == evaluate_expr(expr.rhs).value)() :
                                                                                            expr.kind === "ne" ? (() => evaluate_expr(expr.lhs).value != evaluate_expr(expr.rhs).value)() :
                                                                                                expr.kind === "gt" ? (() => evaluate_expr(expr.lhs).value > evaluate_expr(expr.rhs).value)() :
                                                                                                    expr.kind === "ge" ? (() => evaluate_expr(expr.lhs).value >= evaluate_expr(expr.rhs).value)() :
                                                                                                        expr.kind === "lt" ? (() => evaluate_expr(expr.lhs).value < evaluate_expr(expr.rhs).value)() :
                                                                                                            expr.kind === "le" ? (() => evaluate_expr(expr.lhs).value <= evaluate_expr(expr.rhs).value)() :
                                                                                                                expr.kind === "add" ? (() => evaluate_expr(expr.lhs).value + evaluate_expr(expr.rhs).value)() :
                                                                                                                    expr.kind === "sub" ? (() => evaluate_expr(expr.lhs).value - evaluate_expr(expr.rhs).value)() :
                                                                                                                        expr.kind === "mul" ? (() => evaluate_expr(expr.lhs).value * evaluate_expr(expr.rhs).value)() :
                                                                                                                            expr.kind === "div" ? (() => evaluate_expr(expr.lhs).value / evaluate_expr(expr.rhs).value)() :
                                                                                                                                expr.kind === "mod" ? (() => evaluate_expr(expr.lhs).value % evaluate_expr(expr.rhs).value)() :
                                                                                                                                    expr.kind === "shl" ? (() => evaluate_expr(expr.lhs).value << evaluate_expr(expr.rhs).value)() :
                                                                                                                                        expr.kind === "shr" ? (() => evaluate_expr(expr.lhs).value >> evaluate_expr(expr.rhs).value)() :
                                                                                                                                            expr.kind === "bitand" ? (() => evaluate_expr(expr.lhs).value & evaluate_expr(expr.rhs).value)() :
                                                                                                                                                expr.kind === "bitxor" ? (() => evaluate_expr(expr.lhs).value ^ evaluate_expr(expr.rhs).value)() :
                                                                                                                                                    expr.kind === "bitor" ? (() => evaluate_expr(expr.lhs).value | evaluate_expr(expr.rhs).value)() :
                                                                                                                                                        expr.kind === "logand" ? (() => evaluate_expr(expr.lhs).value && evaluate_expr(expr.rhs).value)() :
                                                                                                                                                            expr.kind === "logor" ? (() => evaluate_expr(expr.lhs).value || evaluate_expr(expr.rhs).value)() :
                                                                                                                                                                expr.kind === "list" ? (() => expr.opers.map(evaluate_expr))() :
                                                                                                                                                                    (() => {
                                                                                                                                                                        throw `Internal error.`;
                                                                                                                                                                    })() });
    const evaluate_stmt = stmt => stmt.kind === "function" ? (stmt.name.value = (...x) => {
        const vars = new Map();
        enumerate_stmts(stmt.body, vars);
        for (const param of stmt.params) {
            if (vars.has(param)) {
                vars.get(param).value = x[0];
            }
            x = x.slice(1);
        }
        const a = evaluate_stmts(reduce_stmts(stmt.body, vars));
        if (a === null) {
            return a;
        }
        else if (a[0] === "return") {
            return a[1].value;
        }
        else {
            throw "Illegal continue or break statement outside of a loop.";
        }
    }, null) :
        stmt.kind === "if" ? evaluate_expr(stmt.cond).value ? evaluate_stmts(stmt.then) : null :
            stmt.kind === "ifelse" ? evaluate_expr(stmt.cond).value ? evaluate_stmts(stmt.then) : Array.isArray(stmt.else) ? evaluate_stmts(stmt.else) : evaluate_stmt(stmt.else) :
                stmt.kind === "while" ? (() => {
                    for (;;) {
                        const c = evaluate_expr(stmt.cond);
                        if (!c.value)
                            return null;
                        const a = evaluate_stmts(stmt.body);
                        if (a) {
                            if (a[0] === "continue") {
                                continue;
                            }
                            else if (a[0] === "break") {
                                break;
                            }
                            else if (a[0] === "return") {
                                return a;
                            }
                            else
                                a;
                        }
                    }
                    return null;
                })() :
                    stmt.kind === "dowhile" ? (() => {
                        for (;;) {
                            const a = evaluate_stmts(stmt.body);
                            if (a) {
                                if (a[0] === "continue") {
                                    continue;
                                }
                                else if (a[0] === "break") {
                                    break;
                                }
                                else if (a[0] === "return") {
                                    return a;
                                }
                                else
                                    a;
                            }
                            const c = evaluate_expr(stmt.cond);
                            if (!c.value)
                                return null;
                        }
                        return null;
                    })() :
                        stmt.kind === "for" ? (() => {
                            evaluate_expr(stmt.conds[0]);
                            for (;;) {
                                const c = evaluate_expr(stmt.conds[1]);
                                if (!c.value)
                                    return null;
                                const a = evaluate_stmts(stmt.body);
                                if (a) {
                                    if (a[0] === "continue") {
                                        continue;
                                    }
                                    else if (a[0] === "break") {
                                        break;
                                    }
                                    else if (a[0] === "return") {
                                        return a;
                                    }
                                    else
                                        a;
                                }
                                evaluate_expr(stmt.conds[2]);
                            }
                            return null;
                        })() :
                            stmt.kind === "forin" ? (() => { throw "not impl"; })() :
                                stmt.kind === "return" ? ["return", evaluate_expr(stmt.oper)] :
                                    stmt.kind === "expr" ? (evaluate_expr(stmt.expr), null) :
                                        stmt.kind === "break" ? ["break"] :
                                            stmt.kind === "continue" ? ["continue"] :
                                                stmt.kind === "empty" ? null :
                                                    stmt;
    const evaluate_stmts = stmts => {
        for (const stmt of stmts) {
            const a = evaluate_stmt(stmt);
            if (a)
                return a;
        }
        return null;
    };
    return (() => {
        const vars = new Map();
        enumerate_stmts(all, vars);
        if (vars.has("print")) {
            vars.set("print", { kind: "lit", value: x => (print(JSON.stringify(x)), null) });
        }
        const a = evaluate_stmts(reduce_stmts(all, vars));
        if (a)
            throw "Illegal break, continue, or return statement outside a loop or function.";
    })();
};
//# sourceMappingURL=evaluate.js.map