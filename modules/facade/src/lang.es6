export var Type = Function;

export class FIELD {
  constructor(definition) {
    this.definition = definition;
  }
}

export class CONST {}
export class ABSTRACT {}
export class IMPLEMENTS {}


export function isPresent(obj):bool{
  return obj != undefined && obj != null;
}

export function isBlank(obj):bool{
  return obj == undefined || obj == null;
}

export function stringify(token):string {
  if (typeof token === 'string') {
    return token;
  }

  if (token === undefined || token === null) {
    return '' + token;
  }

  if (token.name) {
    return token.name;
  }

  return token.toString();
}

export class StringWrapper {
  static fromCharCode(code:int) {
    return String.fromCharCode(code);
  }

  static charCodeAt(s:string, index:int) {
    return s.charCodeAt(index);
  }
}

export class StringJoiner {
  constructor() {
    this.parts = [];
  }

  add(part:string) {
    this.parts.push(part);
  }

  toString():string {
    return this.parts.join("");
  }
}

export class NumerParseError extends Error {
  constructor(message) {
    this.message = message;
  }

  toString() {
    return this.message;
  }
}


export class NumberWrapper {
  static parseIntAutoRadix(text:string):int {
    var result:int = parseInt(text);
    if (isNaN(result)) {
      throw new NumerParseError("Invalid integer literal when parsing " + text);
    }
    return result;
  }

  static parseInt(text:string, radix:int):int {
    if (radix == 10) {
      if (/^(\-|\+)?[0-9]+$/.test(text)) {
        return parseInt(text, radix);
      }
    } else if (radix == 16) {
      if (/^(\-|\+)?[0-9ABCDEFabcdef]+$/.test(text)) {
        return parseInt(text, radix);
      }
    } else {
      var result:int = parseInt(text, radix);
      if (!isNaN(result)) {
        return result;
      }
    }
    throw new NumerParseError("Invalid integer literal when parsing " + text + " in base " + radix);
  }

  // TODO: NaN is a valid literal but is returned by parseFloat to indicate an error.
  static parseFloat(text:string):number {
    return parseFloat(text);
  }
}

export function int() {};
export var bool = $traceurRuntime.type.boolean;
int.assert = function(value) {
  return value == null || typeof value == 'number' && value === Math.floor(value);
}
