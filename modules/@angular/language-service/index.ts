/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * @module
 * @description
 * Entry point for all public APIs of the language service package.
 */
import * as ts from 'typescript';

import {LanguageServicePlugin} from './src/ts_plugin';

export {createLanguageService} from './src/language_service';
export {Completion, Completions, Declaration, Declarations, Definition, Diagnostic, Diagnostics, Hover, HoverTextSection, LanguageService, LanguageServiceHost, Location, Span, TemplateSource, TemplateSources} from './src/types';
export {TypeScriptServiceHost, createLanguageServiceFromTypescript} from './src/typescript_host';

export default LanguageServicePlugin;
