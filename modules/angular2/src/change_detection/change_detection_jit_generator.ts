import {BaseException, Type, isBlank, isPresent} from 'angular2/src/facade/lang';
import {List, ListWrapper, MapWrapper, StringMapWrapper} from 'angular2/src/facade/collection';

import {AbstractChangeDetector} from './abstract_change_detector';
import {ChangeDetectionUtil} from './change_detection_util';
import {DirectiveIndex, DirectiveRecord} from './directive_record';

import {
  ProtoRecord,
  RECORD_TYPE_SELF,
  RECORD_TYPE_PROPERTY,
  RECORD_TYPE_LOCAL,
  RECORD_TYPE_INVOKE_METHOD,
  RECORD_TYPE_CONST,
  RECORD_TYPE_INVOKE_CLOSURE,
  RECORD_TYPE_PRIMITIVE_OP,
  RECORD_TYPE_KEYED_ACCESS,
  RECORD_TYPE_PIPE,
  RECORD_TYPE_BINDING_PIPE,
  RECORD_TYPE_INTERPOLATE,
  RECORD_TYPE_SAFE_PROPERTY,
  RECORD_TYPE_SAFE_INVOKE_METHOD
} from './proto_record';


/**
 * The code generator takes a list of proto records and creates a function/class
 * that "emulates" what the developer would write by hand to implement the same
 * kind of behaviour.
*/
var ABSTRACT_CHANGE_DETECTOR = "AbstractChangeDetector";
var UTIL = "ChangeDetectionUtil";
var DISPATCHER_ACCESSOR = "this.dispatcher";
var PIPE_REGISTRY_ACCESSOR = "this.pipeRegistry";
var PROTOS_ACCESSOR = "this.protos";
var DIRECTIVES_ACCESSOR = "this.directiveRecords";
var CONTEXT_ACCESSOR = "this.context";
var IS_CHANGED_LOCAL = "isChanged";
var CHANGES_LOCAL = "changes";
var LOCALS_ACCESSOR = "this.locals";
var MODE_ACCESSOR = "this.mode";
var CURRENT_PROTO = "currentProto";


export class ChangeDetectorJITGenerator {
  _localNames: List<string>;
  _changeNames: List<string>;
  _fieldNames: List<string>;
  _pipeNames: List<string>;

  constructor(public typeName: string, public changeDetectionStrategy: string,
              public records: List<ProtoRecord>, public directiveRecords: List<any>) {
    this._localNames = this._getLocalNames(records);
    this._changeNames = this._getChangeNames(this._localNames);
    this._fieldNames = this._getFieldNames(this._localNames);
    this._pipeNames = this._getPipeNames(this._localNames);
  }

  _getLocalNames(records: List<ProtoRecord>): List<string> {
    var index = 0;
    var names = records.map((r) => {
      var sanitizedName = r.name.replace(new RegExp("\\W", "g"), '');
      return `${sanitizedName}${index++}`
    });
    return ["context"].concat(names);
  }

  _getChangeNames(_localNames: List<string>): List<string> {
    return _localNames.map((n) => `change_${n}`);
  }

  _getFieldNames(_localNames: List<string>): List<string> {
    return _localNames.map((n) => `this.${n}`);
  }

  _getPipeNames(_localNames: List<string>): List<string> {
    return _localNames.map((n) => `this.${n}_pipe`);
  }

  generate(): Function {
    var classDefinition = `
      var ${this.typeName} = function ${this.typeName}(dispatcher, pipeRegistry, protos, directiveRecords) {
        ${ABSTRACT_CHANGE_DETECTOR}.call(this);
        ${DISPATCHER_ACCESSOR} = dispatcher;
        ${PIPE_REGISTRY_ACCESSOR} = pipeRegistry;
        ${PROTOS_ACCESSOR} = protos;
        ${DIRECTIVES_ACCESSOR} = directiveRecords;
        ${LOCALS_ACCESSOR} = null;
        ${this._genFieldDefinitions()}
      }

      ${this.typeName}.prototype = Object.create(${ABSTRACT_CHANGE_DETECTOR}.prototype);

      ${this.typeName}.prototype.detectChangesInRecords = function(throwOnChange) {
        ${this._genLocalDefinitions()}
        ${this._genChangeDefinitions()}
        var ${IS_CHANGED_LOCAL} = false;
        var ${CURRENT_PROTO};
        var ${CHANGES_LOCAL} = null;

        context = ${CONTEXT_ACCESSOR};

        ${this.records.map((r) => this._genRecord(r)).join("\n")}
      }

      ${this.typeName}.prototype.callOnAllChangesDone = function() {
        ${this._genCallOnAllChangesDoneBody()}
      }

      ${this.typeName}.prototype.hydrate = function(context, locals, directives) {
        ${MODE_ACCESSOR} = "${ChangeDetectionUtil.changeDetectionMode(this.changeDetectionStrategy)}";
        ${CONTEXT_ACCESSOR} = context;
        ${LOCALS_ACCESSOR} = locals;
        ${this._genHydrateDirectives()}
        ${this._genHydrateDetectors()}
      }

      ${this.typeName}.prototype.dehydrate = function() {
        ${this._genPipeOnDestroy()}
        ${this._genFieldDefinitions()}
        ${LOCALS_ACCESSOR} = null;
      }

      ${this.typeName}.prototype.hydrated = function() {
        return ${CONTEXT_ACCESSOR} !== ${UTIL}.uninitialized();
      }

      return function(dispatcher, pipeRegistry) {
        return new ${this.typeName}(dispatcher, pipeRegistry, protos, directiveRecords);
      }
    `;

    return new Function('AbstractChangeDetector', 'ChangeDetectionUtil', 'protos',
                        'directiveRecords', classDefinition)(
        AbstractChangeDetector, ChangeDetectionUtil, this.records, this.directiveRecords);
  }

  _genGetDirectiveFieldNames(): List<string> {
    return this.directiveRecords.map((d) => this._genGetDirective(d.directiveIndex));
  }

  _genGetDetectorFieldNames(): List<string> {
    return this.directiveRecords.filter(r => r.isOnPushChangeDetection())
        .map((d) => this._genGetDetector(d.directiveIndex));
  }

  _genGetDirective(d: DirectiveIndex) { return `this.directive_${d.name}`; }

  _genGetDetector(d: DirectiveIndex) { return `this.detector_${d.name}`; }

  _getNonNullPipeNames(): List<string> {
    var pipes = [];
    this.records.forEach((r) => {
      if (r.mode === RECORD_TYPE_PIPE || r.mode === RECORD_TYPE_BINDING_PIPE) {
        pipes.push(this._pipeNames[r.selfIndex]);
      }
    });
    return pipes;
  }

  _genFieldDefinitions() {
    var fields = [];
    fields = fields.concat(this._fieldNames);
    fields = fields.concat(this._getNonNullPipeNames());
    fields = fields.concat(this._genGetDirectiveFieldNames());
    fields = fields.concat(this._genGetDetectorFieldNames());
    return fields.map((n) => `${n} = ${UTIL}.uninitialized();`).join("\n");
  }

  _genHydrateDirectives(): string {
    var directiveFieldNames = this._genGetDirectiveFieldNames();
    var lines = ListWrapper.createFixedSize(directiveFieldNames.length);
    for (var i = 0, iLen = directiveFieldNames.length; i < iLen; ++i) {
      lines[i] =
          `${directiveFieldNames[i]} = directives.getDirectiveFor(${DIRECTIVES_ACCESSOR}[${i}].directiveIndex);`
    }
    return lines.join('\n');
  }

  _genHydrateDetectors(): string {
    var detectorFieldNames = this._genGetDetectorFieldNames();
    var lines = ListWrapper.createFixedSize(detectorFieldNames.length);
    for (var i = 0, iLen = detectorFieldNames.length; i < iLen; ++i) {
      lines[i] = `${detectorFieldNames[i]} =
          directives.getDetectorFor(${DIRECTIVES_ACCESSOR}[${i}].directiveIndex);`
    }
    return lines.join('\n');
  }

  _genPipeOnDestroy(): string {
    return this._getNonNullPipeNames().map((p) => `${p}.onDestroy();`).join("\n");
  }

  _genCallOnAllChangesDoneBody(): string {
    var notifications = [];
    var dirs = this.directiveRecords;

    for (var i = dirs.length - 1; i >= 0; --i) {
      var dir = dirs[i];
      if (dir.callOnAllChangesDone) {
        notifications.push(`${this._genGetDirective(dir.directiveIndex)}.onAllChangesDone();`);
      }
    }

    return notifications.join("\n");
  }

  _genLocalDefinitions(): string { return this._localNames.map((n) => `var ${n};`).join("\n"); }

  _genChangeDefinitions(): string {
    return this._changeNames.map((n) => `var ${n} = false;`).join("\n");
  }

  _genRecord(r: ProtoRecord): string {
    if (r.mode === RECORD_TYPE_PIPE || r.mode === RECORD_TYPE_BINDING_PIPE) {
      return this._genPipeCheck(r);
    } else {
      return this._genReferenceCheck(r);
    }
  }

  _genPipeCheck(r: ProtoRecord): string {
    var context = this._localNames[r.contextIndex];
    var oldValue = this._fieldNames[r.selfIndex];
    var newValue = this._localNames[r.selfIndex];
    var change = this._changeNames[r.selfIndex];

    var pipe = this._pipeNames[r.selfIndex];
    var cdRef = r.mode === RECORD_TYPE_BINDING_PIPE ? "this.ref" : "null";

    var protoIndex = r.selfIndex - 1;
    var pipeType = r.name;

    return `
      ${CURRENT_PROTO} = ${PROTOS_ACCESSOR}[${protoIndex}];
      if (${pipe} === ${UTIL}.uninitialized()) {
        ${pipe} = ${PIPE_REGISTRY_ACCESSOR}.get('${pipeType}', ${context}, ${cdRef});
      } else if (!${pipe}.supports(${context})) {
        ${pipe}.onDestroy();
        ${pipe} = ${PIPE_REGISTRY_ACCESSOR}.get('${pipeType}', ${context}, ${cdRef});
      }

      ${newValue} = ${pipe}.transform(${context});
      if (${oldValue} !== ${newValue}) {
        ${newValue} = ${UTIL}.unwrapValue(${newValue});
        ${change} = true;
        ${this._genUpdateDirectiveOrElement(r)}
        ${this._genAddToChanges(r)}
        ${oldValue} = ${newValue};
      }
      ${this._genLastInDirective(r)}
    `;
  }

  _genReferenceCheck(r: ProtoRecord): string {
    var oldValue = this._fieldNames[r.selfIndex];
    var newValue = this._localNames[r.selfIndex];

    var protoIndex = r.selfIndex - 1;
    var check = `
      ${CURRENT_PROTO} = ${PROTOS_ACCESSOR}[${protoIndex}];
      ${this._genUpdateCurrentValue(r)}
      if (${newValue} !== ${oldValue}) {
        ${this._changeNames[r.selfIndex]} = true;
        ${this._genUpdateDirectiveOrElement(r)}
        ${this._genAddToChanges(r)}
        ${oldValue} = ${newValue};
      }
      ${this._genLastInDirective(r)}
    `;

    if (r.isPureFunction()) {
      var condition = `${this._changeNames.join(" || ")}`;
      return `if (${condition}) { ${check} }`;
    } else {
      return check;
    }
  }

  _genUpdateCurrentValue(r: ProtoRecord): string {
    var context = (r.contextIndex == -1) ? this._genGetDirective(r.directiveIndex) :
                                           this._localNames[r.contextIndex];
    var newValue = this._localNames[r.selfIndex];
    var argString = r.args.map((arg) => this._localNames[arg]).join(", ");

    var rhs;
    switch (r.mode) {
      case RECORD_TYPE_SELF:
        rhs = context;
        break;

      case RECORD_TYPE_CONST:
        rhs = JSON.stringify(r.funcOrValue);
        break;

      case RECORD_TYPE_PROPERTY:
        rhs = `${context}.${r.name}`;
        break;

      case RECORD_TYPE_SAFE_PROPERTY:
        rhs = `${UTIL}.isValueBlank(${context}) ? null : ${context}.${r.name}`;
        break;

      case RECORD_TYPE_LOCAL:
        rhs = `${LOCALS_ACCESSOR}.get('${r.name}')`;
        break;

      case RECORD_TYPE_INVOKE_METHOD:
        rhs = `${context}.${r.name}(${argString})`;
        break;

      case RECORD_TYPE_SAFE_INVOKE_METHOD:
        rhs = `${UTIL}.isValueBlank(${context}) ? null : ${context}.${r.name}(${argString})`;
        break;

      case RECORD_TYPE_INVOKE_CLOSURE:
        rhs = `${context}(${argString})`;
        break;

      case RECORD_TYPE_PRIMITIVE_OP:
        rhs = `${UTIL}.${r.name}(${argString})`;
        break;

      case RECORD_TYPE_INTERPOLATE:
        rhs = this._genInterpolation(r);
        break;

      case RECORD_TYPE_KEYED_ACCESS:
        rhs = `${context}[${this._localNames[r.args[0]]}]`;
        break;

      default:
        throw new BaseException(`Unknown operation ${r.mode}`);
    }
    return `${newValue} = ${rhs}`;
  }

  _genInterpolation(r: ProtoRecord): string {
    var res = "";
    for (var i = 0; i < r.args.length; ++i) {
      res += JSON.stringify(r.fixedArgs[i]);
      res += " + ";
      res += this._localNames[r.args[i]];
      res += " + ";
    }
    res += JSON.stringify(r.fixedArgs[r.args.length]);
    return res;
  }

  _genUpdateDirectiveOrElement(r: ProtoRecord): string {
    if (!r.lastInBinding) return "";

    var newValue = this._localNames[r.selfIndex];
    var oldValue = this._fieldNames[r.selfIndex];

    var br = r.bindingRecord;
    if (br.isDirective()) {
      var directiveProperty =
          `${this._genGetDirective(br.directiveRecord.directiveIndex)}.${br.propertyName}`;
      return `
        ${this._genThrowOnChangeCheck(oldValue, newValue)}
        ${directiveProperty} = ${newValue};
        ${IS_CHANGED_LOCAL} = true;
      `;
    } else {
      return `
        ${this._genThrowOnChangeCheck(oldValue, newValue)}
        ${DISPATCHER_ACCESSOR}.notifyOnBinding(${CURRENT_PROTO}.bindingRecord, ${newValue});
      `;
    }
  }

  _genThrowOnChangeCheck(oldValue: string, newValue: string): string {
    return `
      if(throwOnChange) {
        ${UTIL}.throwOnChange(${CURRENT_PROTO}, ${UTIL}.simpleChange(${oldValue}, ${newValue}));
      }
      `;
  }

  _genAddToChanges(r: ProtoRecord): string {
    var newValue = this._localNames[r.selfIndex];
    var oldValue = this._fieldNames[r.selfIndex];
    if (!r.bindingRecord.callOnChange()) return "";
    return `
      ${CHANGES_LOCAL} = ${UTIL}.addChange(
          ${CHANGES_LOCAL}, ${CURRENT_PROTO}.bindingRecord.propertyName,
          ${UTIL}.simpleChange(${oldValue}, ${newValue}));
    `;
  }

  _genLastInDirective(r: ProtoRecord): string {
    return `
      ${this._genNotifyOnChanges(r)}
      ${this._genNotifyOnPushDetectors(r)}
      ${IS_CHANGED_LOCAL} = false;
    `;
  }

  _genNotifyOnChanges(r: ProtoRecord): string {
    var br = r.bindingRecord;
    if (!r.lastInDirective || !br.callOnChange()) return "";
    return `
      if(${CHANGES_LOCAL}) {
        ${this._genGetDirective(br.directiveRecord.directiveIndex)}.onChange(${CHANGES_LOCAL});
        ${CHANGES_LOCAL} = null;
      }
    `;
  }

  _genNotifyOnPushDetectors(r: ProtoRecord): string {
    var br = r.bindingRecord;
    if (!r.lastInDirective || !br.isOnPushChangeDetection()) return "";
    var retVal = `
      if(${IS_CHANGED_LOCAL}) {
        ${this._genGetDetector(br.directiveRecord.directiveIndex)}.markAsCheckOnce();
      }
    `;
    return retVal;
  }
}
