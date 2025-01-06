/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { registerLanguage } from '../_.contribution';
registerLanguage({
    id: 'sql',
    extensions: ['.sql'],
    aliases: ['SQL'],
    loader: () => {
        if (AMD) {
            return new Promise((resolve, reject) => {
                require(['vs/basic-languages/sql/sql'], resolve, reject);
            });
        }
        else {
            return import('./sql');
        }
    }
});
//# sourceMappingURL=sql.contribution.js.map