/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { initialize } from 'monaco-editor-core/esm/vs/editor/editor.worker';
import * as ts from './lib/typescriptServices';
import { TypeScriptWorker, create } from './tsWorker';
import { libFileMap } from './lib/lib';
self.onmessage = () => {
    // ignore the first message
    initialize((ctx, createData) => {
        return create(ctx, createData);
    });
};
export { TypeScriptWorker, create, initialize, libFileMap, ts };
//# sourceMappingURL=ts.worker.js.map