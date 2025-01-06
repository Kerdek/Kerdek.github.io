/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { registerLanguage } from '../_.contribution';
registerLanguage({
    id: 'cameligo',
    extensions: ['.mligo'],
    aliases: ['Cameligo'],
    loader: () => {
        if (AMD) {
            return new Promise((resolve, reject) => {
                require(['vs/basic-languages/cameligo/cameligo'], resolve, reject);
            });
        }
        else {
            return import('./cameligo');
        }
    }
});
//# sourceMappingURL=cameligo.contribution.js.map