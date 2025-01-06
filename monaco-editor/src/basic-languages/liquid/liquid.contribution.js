/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { registerLanguage } from '../_.contribution';
registerLanguage({
    id: 'liquid',
    extensions: ['.liquid', '.html.liquid'],
    aliases: ['Liquid', 'liquid'],
    mimetypes: ['application/liquid'],
    loader: () => {
        if (AMD) {
            return new Promise((resolve, reject) => {
                require(['vs/basic-languages/liquid/liquid'], resolve, reject);
            });
        }
        else {
            return import('./liquid');
        }
    }
});
//# sourceMappingURL=liquid.contribution.js.map