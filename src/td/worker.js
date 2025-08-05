"use strict";
const f = Function;
const pm = self.postMessage;
self.onmessage = (e) => {
    pm(new f(e.data)());
};
delete self['close'];
delete self['postMessage'];
//# sourceMappingURL=worker.js.map