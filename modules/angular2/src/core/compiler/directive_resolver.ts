import {resolveForwardRef, Injectable} from 'angular2/di';
import {Type, isPresent, BaseException, stringify} from 'angular2/src/core/facade/lang';
import {ListWrapper, StringMapWrapper} from 'angular2/src/core/facade/collection';
import {
  DirectiveMetadata,
  ComponentMetadata,
  PropertyMetadata,
  EventMetadata
} from 'angular2/metadata';
import {reflector} from 'angular2/src/core/reflection/reflection';

/**
 * Resolve a `Type` for {@link DirectiveMetadata}.
 *
 * This interface can be overridden by the application developer to create custom behavior.
 *
 * See {@link Compiler}
 */
@Injectable()
export class DirectiveResolver {
  /**
   * Return {@link DirectiveMetadata} for a given `Type`.
   */
  resolve(type: Type): DirectiveMetadata {
    var typeMetadata = reflector.annotations(resolveForwardRef(type));
    if (isPresent(typeMetadata)) {
      for (var i = 0; i < typeMetadata.length; i++) {
        var metadata = typeMetadata[i];
        if (metadata instanceof DirectiveMetadata) {
          var propertyMetadata = reflector.propMetadata(type);
          return this._mergeWithPropertyMetadata(metadata, propertyMetadata);
        }
      }
    }
    throw new BaseException(`No Directive annotation found on ${stringify(type)}`);
  }

  private _mergeWithPropertyMetadata(dm: DirectiveMetadata,
                                     propertyMetadata:
                                         StringMap<string, any[]>): DirectiveMetadata {
    var properties = [];
    var events = [];

    StringMapWrapper.forEach(propertyMetadata, (metadata: any[], propName: string) => {
      metadata.forEach(a => {
        if (a instanceof PropertyMetadata) {
          if (isPresent(a.bindingPropertyName)) {
            properties.push(`${propName}: ${a.bindingPropertyName}`);
          } else {
            properties.push(propName);
          }
        }

        if (a instanceof EventMetadata) {
          if (isPresent(a.bindingPropertyName)) {
            events.push(`${propName}: ${a.bindingPropertyName}`);
          } else {
            events.push(propName);
          }
        }
      });
    });

    return this._merge(dm, properties, events);
  }

  private _merge(dm: DirectiveMetadata, properties: string[], events: string[]): DirectiveMetadata {
    var mergedProperties =
        isPresent(dm.properties) ? ListWrapper.concat(dm.properties, properties) : properties;
    var mergedEvents = isPresent(dm.events) ? ListWrapper.concat(dm.events, events) : events;

    if (dm instanceof ComponentMetadata) {
      return new ComponentMetadata({
        selector: dm.selector,
        properties: mergedProperties,
        events: mergedEvents,
        host: dm.host,
        lifecycle: dm.lifecycle,
        bindings: dm.bindings,
        exportAs: dm.exportAs,
        compileChildren: dm.compileChildren,
        changeDetection: dm.changeDetection,
        viewBindings: dm.viewBindings
      });

    } else {
      return new DirectiveMetadata({
        selector: dm.selector,
        properties: mergedProperties,
        events: mergedEvents,
        host: dm.host,
        lifecycle: dm.lifecycle,
        bindings: dm.bindings,
        exportAs: dm.exportAs,
        compileChildren: dm.compileChildren
      });
    }
  }
}
