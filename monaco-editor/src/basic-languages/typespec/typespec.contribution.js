/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { registerLanguage } from '../_.contribution';
registerLanguage({
    id: 'typespec',
    extensions: ['.tsp'],
    aliases: ['TypeSpec'],
    loader: () => {
        if (AMD) {
            return new Promise((resolve, reject) => {
                require(['vs/basic-languages/typespec/typespec'], resolve, reject);
            });
        }
        else {
            return import('./typespec');
        }
    }
});
//# sourceMappingURL=typespec.contribution.js.map