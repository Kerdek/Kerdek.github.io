export function joe(program) {
    const stack = [];
    const istack = [];
    let main = program["main"];
    if (main === undefined) {
        throw new Error("No `main` found in program.");
    }
    let pc = [main, 0];
    let pcd = pc;
    function operand(op) {
        if (op[0] === "immediate") {
            return op[1];
        }
        else {
            return stack[op[1]];
        }
    }
    const table = {
        ccallcc: ([, off, where]) => {
            if (stack[off]) {
                const w = program[where];
                if (w === undefined) {
                    throw new Error(`Undefined label \`${where}\`.`);
                }
                pc = [w, 0];
            }
        },
        callcc: ([, where]) => {
            const w = program[where];
            if (w === undefined) {
                throw new Error(`Undefined label \`${where}\`.`);
            }
            pc = [w, 0];
        },
        call: ([, where]) => {
            istack.unshift(pcd);
            const w = program[where];
            if (w === undefined) {
                throw new Error(`Undefined label \`${where}\`.`);
            }
            pc = [w, 0];
        }, ret: ([]) => (pc = istack.shift()),
        push: ([, op]) => stack.unshift(operand(op)),
        pop: ([]) => stack.shift(),
        delete: ([, off]) => stack.splice(off, 1),
        newArray: ([]) => stack.unshift([]),
        ppush: ([, opa, opb]) => operand(opa).unshift(operand(opb)),
        ppop: ([, op]) => operand(op).shift(),
        pget: ([, op, off]) => operand(op)[off],
        pdelete: ([, op, off]) => delete operand(op)[off],
        add: ([, opa, opb]) => stack.unshift(operand(opa) + operand(opb)),
        sub: ([, opa, opb]) => stack.unshift(operand(opa) - operand(opb)),
        mul: ([, opa, opb]) => stack.unshift(operand(opa) * operand(opb)),
        eq: ([, opa, opb]) => stack.unshift(operand(opa) === operand(opb))
    };
    for (;;) {
        if (pc === undefined) {
            return stack;
        }
        pcd = pc;
        const ins = pc[0][pc[1]++];
        if (ins === undefined)
            table["ret"](["ret"]);
        else
            table[ins[0]](ins);
    }
}
let res = await fetch(`./demo.joe.json`);
if (!res.ok) {
    throw new Error(`HTTP status ${res.status} while fetching \`./${res.url}\``);
}
console.log(joe(JSON.parse(await res.text())));
//# sourceMappingURL=joe.js.map