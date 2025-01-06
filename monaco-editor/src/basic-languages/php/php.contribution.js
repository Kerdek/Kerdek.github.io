/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { registerLanguage } from '../_.contribution';
registerLanguage({
    id: 'php',
    extensions: ['.php', '.php4', '.php5', '.phtml', '.ctp'],
    aliases: ['PHP', 'php'],
    mimetypes: ['application/x-php'],
    loader: () => {
        if (AMD) {
            return new Promise((resolve, reject) => {
                require(['vs/basic-languages/php/php'], resolve, reject);
            });
        }
        else {
            return import('./php');
        }
    }
});
//# sourceMappingURL=php.contribution.js.map