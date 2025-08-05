export const create_sandbox = () => {
    let work_queue = [];
    let busy = false;
    let worker = new Worker("./worker.js");
    const run = async () => {
        const q = work_queue;
        if (!busy) {
            busy = true;
            for (;;) {
                const work = q.shift();
                if (!work) {
                    break;
                }
                await new Promise(c => {
                    const message = (e) => {
                        worker.onmessage = null;
                        worker.onerror = null;
                        work[1](e.data);
                        c();
                    };
                    const error = (e) => {
                        worker.onmessage = null;
                        worker.onerror = null;
                        work[2](new Error(e.message));
                        c();
                    };
                    worker.onmessage = message;
                    worker.onerror = error;
                    worker.postMessage(work[0]);
                });
            }
            busy = false;
        }
    };
    return (text) => {
        const r = new Promise((c, r) => { work_queue.push([text, c, r]); });
        run();
        return r;
    };
};
//# sourceMappingURL=sandbox.js.map