/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { registerLanguage } from '../_.contribution';
registerLanguage({
    id: 'mdx',
    extensions: ['.mdx'],
    aliases: ['MDX', 'mdx'],
    loader: () => {
        if (AMD) {
            return new Promise((resolve, reject) => {
                require(['vs/basic-languages/mdx/mdx'], resolve, reject);
            });
        }
        else {
            return import('./mdx');
        }
    }
});
//# sourceMappingURL=mdx.contribution.js.map