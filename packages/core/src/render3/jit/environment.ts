/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ΔdefineInjectable, ΔdefineInjector,} from '../../di/interface/defs';
import {Δinject} from '../../di/injector_compatibility';
import * as r3 from '../index';
import * as sanitization from '../../sanitization/sanitization';


/**
 * A mapping of the @angular/core API surface used in generated expressions to the actual symbols.
 *
 * This should be kept up to date with the public exports of @angular/core.
 */
export const angularCoreEnv: {[name: string]: Function} = {
  'ΔdefineBase': r3.ΔdefineBase,
  'ΔdefineComponent': r3.ΔdefineComponent,
  'ΔdefineDirective': r3.ΔdefineDirective,
  'ΔdefineInjectable': ΔdefineInjectable,
  'ΔdefineInjector': ΔdefineInjector,
  'ΔdefineNgModule': r3.ΔdefineNgModule,
  'ΔdefinePipe': r3.ΔdefinePipe,
  'ΔdirectiveInject': r3.ΔdirectiveInject,
  'ΔgetFactoryOf': r3.ΔgetFactoryOf,
  'ΔgetInheritedFactory': r3.ΔgetInheritedFactory,
  'Δinject': Δinject,
  'ΔinjectAttribute': r3.ΔinjectAttribute,
  'ΔtemplateRefExtractor': r3.ΔtemplateRefExtractor,
  'ΔNgOnChangesFeature': r3.ΔNgOnChangesFeature,
  'ΔProvidersFeature': r3.ΔProvidersFeature,
  'ΔInheritDefinitionFeature': r3.ΔInheritDefinitionFeature,
  'ΔelementAttribute': r3.ΔelementAttribute,
  'Δbind': r3.Δbind,
  'Δcontainer': r3.Δcontainer,
  'ΔnextContext': r3.ΔnextContext,
  'ΔcontainerRefreshStart': r3.ΔcontainerRefreshStart,
  'ΔcontainerRefreshEnd': r3.ΔcontainerRefreshEnd,
  'ΔnamespaceHTML': r3.ΔnamespaceHTML,
  'ΔnamespaceMathML': r3.ΔnamespaceMathML,
  'ΔnamespaceSVG': r3.ΔnamespaceSVG,
  'ΔenableBindings': r3.ΔenableBindings,
  'ΔdisableBindings': r3.ΔdisableBindings,
  'ΔallocHostVars': r3.ΔallocHostVars,
  'ΔelementStart': r3.ΔelementStart,
  'ΔelementEnd': r3.ΔelementEnd,
  'Δelement': r3.Δelement,
  'ΔelementContainerStart': r3.ΔelementContainerStart,
  'ΔelementContainerEnd': r3.ΔelementContainerEnd,
  'ΔpureFunction0': r3.ΔpureFunction0,
  'ΔpureFunction1': r3.ΔpureFunction1,
  'ΔpureFunction2': r3.ΔpureFunction2,
  'ΔpureFunction3': r3.ΔpureFunction3,
  'ΔpureFunction4': r3.ΔpureFunction4,
  'ΔpureFunction5': r3.ΔpureFunction5,
  'ΔpureFunction6': r3.ΔpureFunction6,
  'ΔpureFunction7': r3.ΔpureFunction7,
  'ΔpureFunction8': r3.ΔpureFunction8,
  'ΔpureFunctionV': r3.ΔpureFunctionV,
  'ΔgetCurrentView': r3.ΔgetCurrentView,
  'ΔrestoreView': r3.ΔrestoreView,
  'Δinterpolation1': r3.Δinterpolation1,
  'Δinterpolation2': r3.Δinterpolation2,
  'Δinterpolation3': r3.Δinterpolation3,
  'Δinterpolation4': r3.Δinterpolation4,
  'Δinterpolation5': r3.Δinterpolation5,
  'Δinterpolation6': r3.Δinterpolation6,
  'Δinterpolation7': r3.Δinterpolation7,
  'Δinterpolation8': r3.Δinterpolation8,
  'ΔinterpolationV': r3.ΔinterpolationV,
  'Δlistener': r3.Δlistener,
  'Δload': r3.Δload,
  'Δprojection': r3.Δprojection,
  'ΔelementProperty': r3.ΔelementProperty,
  'ΔcomponentHostSyntheticProperty': r3.ΔcomponentHostSyntheticProperty,
  'ΔcomponentHostSyntheticListener': r3.ΔcomponentHostSyntheticListener,
  'ΔpipeBind1': r3.ΔpipeBind1,
  'ΔpipeBind2': r3.ΔpipeBind2,
  'ΔpipeBind3': r3.ΔpipeBind3,
  'ΔpipeBind4': r3.ΔpipeBind4,
  'ΔpipeBindV': r3.ΔpipeBindV,
  'ΔprojectionDef': r3.ΔprojectionDef,
  'Δpipe': r3.Δpipe,
  'ΔqueryRefresh': r3.ΔqueryRefresh,
  'ΔviewQuery': r3.ΔviewQuery,
  'ΔstaticViewQuery': r3.ΔstaticViewQuery,
  'ΔstaticContentQuery': r3.ΔstaticContentQuery,
  'ΔloadViewQuery': r3.ΔloadViewQuery,
  'ΔcontentQuery': r3.ΔcontentQuery,
  'ΔloadContentQuery': r3.ΔloadContentQuery,
  'Δreference': r3.Δreference,
  'ΔelementHostAttrs': r3.ΔelementHostAttrs,
  'ΔelementStyling': r3.ΔelementStyling,
  'ΔelementStylingMap': r3.ΔelementStylingMap,
  'ΔelementStyleProp': r3.ΔelementStyleProp,
  'ΔelementStylingApply': r3.ΔelementStylingApply,
  'ΔelementClassProp': r3.ΔelementClassProp,
  'ΔelementHostStyling': r3.ΔelementHostStyling,
  'ΔelementHostStylingMap': r3.ΔelementHostStylingMap,
  'ΔelementHostStyleProp': r3.ΔelementHostStyleProp,
  'ΔelementHostStylingApply': r3.ΔelementHostStylingApply,
  'ΔelementHostClassProp': r3.ΔelementHostClassProp,
  'Δselect': r3.Δselect,
  'Δtemplate': r3.Δtemplate,
  'Δtext': r3.Δtext,
  'ΔtextBinding': r3.ΔtextBinding,
  'ΔembeddedViewStart': r3.ΔembeddedViewStart,
  'ΔembeddedViewEnd': r3.ΔembeddedViewEnd,
  'Δi18n': r3.Δi18n,
  'Δi18nAttributes': r3.Δi18nAttributes,
  'Δi18nExp': r3.Δi18nExp,
  'Δi18nStart': r3.Δi18nStart,
  'Δi18nEnd': r3.Δi18nEnd,
  'Δi18nApply': r3.Δi18nApply,
  'Δi18nPostprocess': r3.Δi18nPostprocess,
  'ΔresolveWindow': r3.ΔresolveWindow,
  'ΔresolveDocument': r3.ΔresolveDocument,
  'ΔresolveBody': r3.ΔresolveBody,
  'ΔsetComponentScope': r3.ΔsetComponentScope,
  'ΔsetNgModuleScope': r3.ΔsetNgModuleScope,

  'ΔsanitizeHtml': sanitization.ΔsanitizeHtml,
  'ΔsanitizeStyle': sanitization.ΔsanitizeStyle,
  'ΔdefaultStyleSanitizer': sanitization.ΔdefaultStyleSanitizer,
  'ΔsanitizeResourceUrl': sanitization.ΔsanitizeResourceUrl,
  'ΔsanitizeScript': sanitization.ΔsanitizeScript,
  'ΔsanitizeUrl': sanitization.ΔsanitizeUrl,
  'ΔsanitizeUrlOrResourceUrl': sanitization.ΔsanitizeUrlOrResourceUrl
};
