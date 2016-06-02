import {isBlank} from '../src/facade/lang';
import {unimplemented} from '../src/facade/exceptions';
import {Identifiers} from './identifiers';
import {CompileIdentifierMetadata} from './compile_metadata';
import {ViewEncapsulation} from '@angular/core';

export class CompilerConfig {
  public renderTypes: RenderTypes;
  public defaultEncapsulation: ViewEncapsulation;

  constructor(public genDebugInfo: boolean, public logBindingUpdate: boolean,
              public useJit: boolean, renderTypes: RenderTypes = null,
              defaultEncapsulation: ViewEncapsulation = null) {
    if (isBlank(renderTypes)) {
      renderTypes = new DefaultRenderTypes();
    }
    this.renderTypes = renderTypes;
    if (isBlank(defaultEncapsulation)) {
      defaultEncapsulation = ViewEncapsulation.Emulated;
    }
    this.defaultEncapsulation = defaultEncapsulation;
  }
}

/**
 * Types used for the renderer.
 * Can be replaced to specialize the generated output to a specific renderer
 * to help tree shaking.
 */
export abstract class RenderTypes {
  get renderer(): CompileIdentifierMetadata { return unimplemented(); }
  get renderText(): CompileIdentifierMetadata { return unimplemented(); }
  get renderElement(): CompileIdentifierMetadata { return unimplemented(); }
  get renderComment(): CompileIdentifierMetadata { return unimplemented(); }
  get renderNode(): CompileIdentifierMetadata { return unimplemented(); }
  get renderEvent(): CompileIdentifierMetadata { return unimplemented(); }
}

export class DefaultRenderTypes implements RenderTypes {
  renderer = Identifiers.Renderer;
  renderText = null;
  renderElement = null;
  renderComment = null;
  renderNode = null;
  renderEvent = null;
}
