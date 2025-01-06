/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { registerLanguage } from '../_.contribution';
registerLanguage({
    id: 'markdown',
    extensions: ['.md', '.markdown', '.mdown', '.mkdn', '.mkd', '.mdwn', '.mdtxt', '.mdtext'],
    aliases: ['Markdown', 'markdown'],
    loader: () => {
        if (AMD) {
            return new Promise((resolve, reject) => {
                require(['vs/basic-languages/markdown/markdown'], resolve, reject);
            });
        }
        else {
            return import('./markdown');
        }
    }
});
//# sourceMappingURL=markdown.contribution.js.map