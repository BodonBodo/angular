/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {assertNumber, assertString} from '../../util/assert';
import {ELEMENT_MARKER, getInstructionFromI18nMutateOpCode, getParentFromI18nMutateOpCode, getRefFromI18nMutateOpCode, I18nCreateOpCode, I18nMutateOpCode, I18nMutateOpCodes, I18nUpdateOpCode, I18nUpdateOpCodes, ICU_MARKER} from '../interfaces/i18n';


/**
 * Converts `I18nCreateOpCodes` array into a human readable format.
 *
 * This function is attached to the `I18nCreateOpCodes.debug` property if `ngDevMode` is enabled.
 * This function provides a human readable view of the opcodes. This is useful when debugging the
 * application as well as writing more readable tests.
 *
 * @param this `I18nCreateOpCodes` if attached as a method.
 * @param opcodes `I18nCreateOpCodes` if invoked as a function.
 */
export function i18nCreateOpCodesToString(
    this: I18nUpdateOpCodes|void, opcodes?: I18nUpdateOpCodes): string[] {
  const createOpCodes: I18nUpdateOpCodes = opcodes || (Array.isArray(this) ? this : []);
  let lines: string[] = [];
  for (let i = 0; i < createOpCodes.length; i++) {
    const opCode = createOpCodes[i++] as any;
    const text = createOpCodes[i] as string;
    const isComment = (opCode & I18nCreateOpCode.COMMENT) === I18nCreateOpCode.COMMENT;
    const appendNow =
        (opCode & I18nCreateOpCode.APPEND_EAGERLY) === I18nCreateOpCode.APPEND_EAGERLY;
    const index = opCode >>> I18nCreateOpCode.SHIFT;
    lines.push(`lView[${index}] = document.${isComment ? 'createComment' : 'createText'}(${
        JSON.stringify(text)});`);
    if (appendNow) {
      lines.push(`parent.appendChild(lView[${index}]);`);
    }
  }
  return lines;
}

/**
 * Converts `I18nUpdateOpCodes` array into a human readable format.
 *
 * This function is attached to the `I18nUpdateOpCodes.debug` property if `ngDevMode` is enabled.
 * This function provides a human readable view of the opcodes. This is useful when debugging the
 * application as well as writing more readable tests.
 *
 * @param this `I18nUpdateOpCodes` if attached as a method.
 * @param opcodes `I18nUpdateOpCodes` if invoked as a function.
 */
export function i18nUpdateOpCodesToString(
    this: I18nUpdateOpCodes|void, opcodes?: I18nUpdateOpCodes): string[] {
  const parser = new OpCodeParser(opcodes || (Array.isArray(this) ? this : []));
  let lines: string[] = [];

  function consumeOpCode(value: number): string {
    const ref = value >>> I18nUpdateOpCode.SHIFT_REF;
    const opCode = value & I18nUpdateOpCode.MASK_OPCODE;
    switch (opCode) {
      case I18nUpdateOpCode.Text:
        return `(lView[${ref}] as Text).textContent = $$$`;
      case I18nUpdateOpCode.Attr:
        const attrName = parser.consumeString();
        const sanitizationFn = parser.consumeFunction();
        const value = sanitizationFn ? `(${sanitizationFn})($$$)` : '$$$';
        return `(lView[${ref}] as Element).setAttribute('${attrName}', ${value})`;
      case I18nUpdateOpCode.IcuSwitch:
        return `icuSwitchCase(${ref}, $$$)`;
      case I18nUpdateOpCode.IcuUpdate:
        return `icuUpdateCase(${ref})`;
    }
    throw new Error('unexpected OpCode');
  }


  while (parser.hasMore()) {
    let mask = parser.consumeNumber();
    let size = parser.consumeNumber();
    const end = parser.i + size;
    const statements: string[] = [];
    let statement = '';
    while (parser.i < end) {
      let value = parser.consumeNumberOrString();
      if (typeof value === 'string') {
        statement += value;
      } else if (value < 0) {
        // Negative numbers are ref indexes
        // Here `i` refers to current binding index. It is to signify that the value is relative,
        // rather than absolute.
        statement += '${lView[i' + value + ']}';
      } else {
        // Positive numbers are operations.
        const opCodeText = consumeOpCode(value);
        statements.push(opCodeText.replace('$$$', '`' + statement + '`') + ';');
        statement = '';
      }
    }
    lines.push(`if (mask & 0b${mask.toString(2)}) { ${statements.join(' ')} }`);
  }
  return lines;
}

/**
 * Converts `I18nMutableOpCodes` array into a human readable format.
 *
 * This function is attached to the `I18nMutableOpCodes.debug` if `ngDevMode` is enabled. This
 * function provides a human readable view of the opcodes. This is useful when debugging the
 * application as well as writing more readable tests.
 *
 * @param this `I18nMutableOpCodes` if attached as a method.
 * @param opcodes `I18nMutableOpCodes` if invoked as a function.
 */
export function i18nMutateOpCodesToString(
    this: I18nMutateOpCodes|void, opcodes?: I18nMutateOpCodes): string[] {
  const parser = new OpCodeParser(opcodes || (Array.isArray(this) ? this : []));
  let lines: string[] = [];

  function consumeOpCode(opCode: number): string {
    const parent = getParentFromI18nMutateOpCode(opCode);
    const ref = getRefFromI18nMutateOpCode(opCode);
    switch (getInstructionFromI18nMutateOpCode(opCode)) {
      case I18nMutateOpCode.AppendChild:
        return `(lView[${parent}] as Element).appendChild(lView[${lastRef}])`;
      case I18nMutateOpCode.Remove:
        return `(lView[${parent}] as Element).remove(lView[${ref}])`;
      case I18nMutateOpCode.Attr:
        return `(lView[${ref}] as Element).setAttribute("${parser.consumeString()}", "${
            parser.consumeString()}")`;
      case I18nMutateOpCode.RemoveNestedIcu:
        return `removeNestedICU(${ref})`;
    }
    throw new Error('Unexpected OpCode');
  }

  let lastRef = -1;
  while (parser.hasMore()) {
    let value = parser.consumeNumberStringOrMarker();
    if (value === ICU_MARKER) {
      const text = parser.consumeString();
      lastRef = parser.consumeNumber();
      lines.push(`lView[${lastRef}] = document.createComment("${text}")`);
    } else if (value === ELEMENT_MARKER) {
      const text = parser.consumeString();
      lastRef = parser.consumeNumber();
      lines.push(`lView[${lastRef}] = document.createElement("${text}")`);
    } else if (typeof value === 'string') {
      lastRef = parser.consumeNumber();
      lines.push(`lView[${lastRef}] = document.createTextNode("${value}")`);
    } else if (typeof value === 'number') {
      const line = consumeOpCode(value);
      line && lines.push(line);
    } else {
      throw new Error('Unexpected value');
    }
  }

  return lines;
}


class OpCodeParser {
  i: number = 0;
  codes: any[];

  constructor(codes: any[]) {
    this.codes = codes;
  }

  hasMore() {
    return this.i < this.codes.length;
  }

  consumeNumber(): number {
    let value = this.codes[this.i++];
    assertNumber(value, 'expecting number in OpCode');
    return value;
  }

  consumeString(): string {
    let value = this.codes[this.i++];
    assertString(value, 'expecting string in OpCode');
    return value;
  }

  consumeFunction(): Function|null {
    let value = this.codes[this.i++];
    if (value === null || typeof value === 'function') {
      return value;
    }
    throw new Error('expecting function in OpCode');
  }

  consumeNumberOrString(): number|string {
    let value = this.codes[this.i++];
    if (typeof value === 'string') {
      return value;
    }
    assertNumber(value, 'expecting number or string in OpCode');
    return value;
  }

  consumeNumberStringOrMarker(): number|string|ICU_MARKER|ELEMENT_MARKER {
    let value = this.codes[this.i++];
    if (typeof value === 'string' || typeof value === 'number' || value == ICU_MARKER ||
        value == ELEMENT_MARKER) {
      return value;
    }
    assertNumber(value, 'expecting number, string, ICU_MARKER or ELEMENT_MARKER in OpCode');
    return value;
  }
}
