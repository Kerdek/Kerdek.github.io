/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { registerLanguage } from '../_.contribution';
registerLanguage({
    id: 'shell',
    extensions: ['.sh', '.bash'],
    aliases: ['Shell', 'sh'],
    loader: () => {
        if (AMD) {
            return new Promise((resolve, reject) => {
                require(['vs/basic-languages/shell/shell'], resolve, reject);
            });
        }
        else {
            return import('./shell');
        }
    }
});
//# sourceMappingURL=shell.contribution.js.map