import {Type, CONST_EXPR, isPresent, isBlank} from 'angular2/src/core/facade/lang';
import {
  RenderTemplateCmd,
  RenderCommandVisitor,
  RenderBeginElementCmd,
  RenderTextCmd,
  RenderNgContentCmd,
  RenderBeginComponentCmd,
  RenderEmbeddedTemplateCmd
} from 'angular2/src/core/render/render';

export class CompiledTemplate {
  private _changeDetectorFactory: Function = null;
  private _styles: string[] = null;
  private _commands: TemplateCmd[] = null;
  // Note: paramGetter is a function so that we can have cycles between templates!
  constructor(public id: number, private _paramGetter: Function) {}

  private _init() {
    if (isBlank(this._commands)) {
      var params = this._paramGetter();
      this._changeDetectorFactory = params[0];
      this._commands = params[1];
      this._styles = params[2];
    }
  }

  get changeDetectorFactory(): Function {
    this._init();
    return this._changeDetectorFactory;
  }

  get styles(): string[] {
    this._init();
    return this._styles;
  }

  get commands(): TemplateCmd[] {
    this._init();
    return this._commands;
  }
}

const EMPTY_ARR = CONST_EXPR([]);

export interface TemplateCmd extends RenderTemplateCmd {
  visit(visitor: CommandVisitor, context: any): any;
}

export class TextCmd implements TemplateCmd, RenderTextCmd {
  constructor(public value: string, public isBound: boolean, public ngContentIndex: number) {}
  visit(visitor: CommandVisitor, context: any): any { return visitor.visitText(this, context); }
}

export function text(value: string, isBound: boolean, ngContentIndex: number): TextCmd {
  return new TextCmd(value, isBound, ngContentIndex);
}

export class NgContentCmd implements TemplateCmd, RenderNgContentCmd {
  isBound: boolean = false;
  constructor(public ngContentIndex: number) {}
  visit(visitor: CommandVisitor, context: any): any {
    return visitor.visitNgContent(this, context);
  }
}

export function ngContent(ngContentIndex: number): NgContentCmd {
  return new NgContentCmd(ngContentIndex);
}

export interface IBeginElementCmd extends TemplateCmd, RenderBeginElementCmd {
  variableNameAndValues: Array<string | number>;
  eventTargetAndNames: string[];
  directives: Type[];
  visit(visitor: CommandVisitor, context: any): any;
}

export class BeginElementCmd implements TemplateCmd, IBeginElementCmd, RenderBeginElementCmd {
  constructor(public name: string, public attrNameAndValues: string[],
              public eventTargetAndNames: string[],
              public variableNameAndValues: Array<string | number>, public directives: Type[],
              public isBound: boolean, public ngContentIndex: number) {}
  visit(visitor: CommandVisitor, context: any): any {
    return visitor.visitBeginElement(this, context);
  }
}

export function beginElement(name: string, attrNameAndValues: string[],
                             eventTargetAndNames: string[],
                             variableNameAndValues: Array<string | number>, directives: Type[],
                             isBound: boolean, ngContentIndex: number): BeginElementCmd {
  return new BeginElementCmd(name, attrNameAndValues, eventTargetAndNames, variableNameAndValues,
                             directives, isBound, ngContentIndex);
}

export class EndElementCmd implements TemplateCmd {
  visit(visitor: CommandVisitor, context: any): any { return visitor.visitEndElement(context); }
}

export function endElement(): TemplateCmd {
  return new EndElementCmd();
}

export class BeginComponentCmd implements TemplateCmd, IBeginElementCmd, RenderBeginComponentCmd {
  isBound: boolean = true;
  templateId: number;
  component: Type;
  constructor(public name: string, public attrNameAndValues: string[],
              public eventTargetAndNames: string[],
              public variableNameAndValues: Array<string | number>, public directives: Type[],
              public nativeShadow: boolean, public ngContentIndex: number,
              public template: CompiledTemplate) {
    this.component = directives[0];
    this.templateId = template.id;
  }
  visit(visitor: CommandVisitor, context: any): any {
    return visitor.visitBeginComponent(this, context);
  }
}

export function beginComponent(
    name: string, attrNameAnsValues: string[], eventTargetAndNames: string[],
    variableNameAndValues: Array<string | number>, directives: Type[], nativeShadow: boolean,
    ngContentIndex: number, template: CompiledTemplate): BeginComponentCmd {
  return new BeginComponentCmd(name, attrNameAnsValues, eventTargetAndNames, variableNameAndValues,
                               directives, nativeShadow, ngContentIndex, template);
}

export class EndComponentCmd implements TemplateCmd {
  visit(visitor: CommandVisitor, context: any): any { return visitor.visitEndComponent(context); }
}

export function endComponent(): TemplateCmd {
  return new EndComponentCmd();
}

export class EmbeddedTemplateCmd implements TemplateCmd, IBeginElementCmd,
    RenderEmbeddedTemplateCmd {
  isBound: boolean = true;
  name: string = null;
  eventTargetAndNames: string[] = EMPTY_ARR;
  constructor(public attrNameAndValues: string[], public variableNameAndValues: string[],
              public directives: Type[], public isMerged: boolean, public ngContentIndex: number,
              public changeDetectorFactory: Function, public children: TemplateCmd[]) {}
  visit(visitor: CommandVisitor, context: any): any {
    return visitor.visitEmbeddedTemplate(this, context);
  }
}

export function embeddedTemplate(attrNameAndValues: string[], variableNameAndValues: string[],
                                 directives: Type[], isMerged: boolean, ngContentIndex: number,
                                 changeDetectorFactory: Function, children: TemplateCmd[]):
    EmbeddedTemplateCmd {
  return new EmbeddedTemplateCmd(attrNameAndValues, variableNameAndValues, directives, isMerged,
                                 ngContentIndex, changeDetectorFactory, children);
}

export interface CommandVisitor extends RenderCommandVisitor {}

export function visitAllCommands(visitor: CommandVisitor, cmds: TemplateCmd[],
                                 context: any = null) {
  for (var i = 0; i < cmds.length; i++) {
    cmds[i].visit(visitor, context);
  }
}
