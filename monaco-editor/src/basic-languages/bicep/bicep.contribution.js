/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { registerLanguage } from '../_.contribution';
registerLanguage({
    id: 'bicep',
    extensions: ['.bicep'],
    aliases: ['Bicep'],
    loader: () => {
        if (AMD) {
            return new Promise((resolve, reject) => {
                require(['vs/basic-languages/bicep/bicep'], resolve, reject);
            });
        }
        else {
            return import('./bicep');
        }
    }
});
//# sourceMappingURL=bicep.contribution.js.map