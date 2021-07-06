// The actual `PrettyPrinter` service has to load `prettify.js`, which (a) is slow and (b) pollutes
// the global `window` object (which in turn may affect other tests).
// This is a mock implementation that does not load `prettify.js` and does not pollute the global
// scope.

import { of } from 'rxjs';
import { unwrapHtmlForSink } from 'safevalues';
import { htmlFromStringKnownToSatisfyTypeContract } from 'safevalues/unsafe/reviewed';

export class MockPrettyPrinter {
  formatCode(code: TrustedHTML, language?: string, linenums?: number | boolean) {
    const linenumsStr = (linenums === undefined) ? '' : `, linenums: ${linenums}`;
    return of(htmlFromStringKnownToSatisfyTypeContract(
        `Formatted code (language: ${language || 'auto'}${linenumsStr}): ${
            unwrapHtmlForSink(code)}`,
        'safe transformation of existing TrustedHTML'));
  }
}
