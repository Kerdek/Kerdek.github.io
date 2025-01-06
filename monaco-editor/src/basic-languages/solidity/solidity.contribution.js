/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { registerLanguage } from '../_.contribution';
registerLanguage({
    id: 'sol',
    extensions: ['.sol'],
    aliases: ['sol', 'solidity', 'Solidity'],
    loader: () => {
        if (AMD) {
            return new Promise((resolve, reject) => {
                require(['vs/basic-languages/solidity/solidity'], resolve, reject);
            });
        }
        else {
            return import('./solidity');
        }
    }
});
//# sourceMappingURL=solidity.contribution.js.map