/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { registerLanguage } from '../_.contribution';
registerLanguage({
    id: 'mysql',
    extensions: [],
    aliases: ['MySQL', 'mysql'],
    loader: () => {
        if (AMD) {
            return new Promise((resolve, reject) => {
                require(['vs/basic-languages/mysql/mysql'], resolve, reject);
            });
        }
        else {
            return import('./mysql');
        }
    }
});
//# sourceMappingURL=mysql.contribution.js.map