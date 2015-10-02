export {TemplateCompiler} from './template_compiler';
export {
  CompileDirectiveMetadata,
  CompileTypeMetadata,
  CompileTemplateMetadata
} from './directive_metadata';
export {SourceModule, SourceWithImports} from './source_module';

import {assertionsEnabled, Type} from 'angular2/src/core/facade/lang';
import {bind, Binding} from 'angular2/src/core/di';
import {TemplateParser} from 'angular2/src/compiler/template_parser';
import {HtmlParser} from 'angular2/src/compiler/html_parser';
import {TemplateNormalizer} from 'angular2/src/compiler/template_normalizer';
import {RuntimeMetadataResolver} from 'angular2/src/compiler/runtime_metadata';
import {ChangeDetectionCompiler} from 'angular2/src/compiler/change_detector_compiler';
import {StyleCompiler} from 'angular2/src/compiler/style_compiler';
import {CommandCompiler} from 'angular2/src/compiler/command_compiler';
import {TemplateCompiler} from 'angular2/src/compiler/template_compiler';
import {ChangeDetectorGenConfig} from 'angular2/src/core/change_detection/change_detection';
import {Compiler} from 'angular2/src/core/linker/compiler';
import {RuntimeCompiler} from 'angular2/src/compiler/runtime_compiler';
import {ElementSchemaRegistry} from 'angular2/src/core/render/dom/schema/element_schema_registry';
import {
  DomElementSchemaRegistry
} from 'angular2/src/core/render/dom/schema/dom_element_schema_registry';

export function compilerBindings(): Array<Type | Binding | any[]> {
  return [
    HtmlParser,
    TemplateParser,
    TemplateNormalizer,
    RuntimeMetadataResolver,
    StyleCompiler,
    CommandCompiler,
    ChangeDetectionCompiler,
    bind(ChangeDetectorGenConfig)
        .toValue(
            new ChangeDetectorGenConfig(assertionsEnabled(), assertionsEnabled(), false, true)),
    TemplateCompiler,
    RuntimeCompiler,
    bind(Compiler).toAlias(RuntimeCompiler),
    DomElementSchemaRegistry,
    bind(ElementSchemaRegistry).toAlias(DomElementSchemaRegistry)
  ];
}
