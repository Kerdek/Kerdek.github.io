/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { registerLanguage } from '../_.contribution';
registerLanguage({
    id: 'go',
    extensions: ['.go'],
    aliases: ['Go'],
    loader: () => {
        if (AMD) {
            return new Promise((resolve, reject) => {
                require(['vs/basic-languages/go/go'], resolve, reject);
            });
        }
        else {
            return import('./go');
        }
    }
});
//# sourceMappingURL=go.contribution.js.map