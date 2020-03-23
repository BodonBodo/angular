import { arrayEquals } from 'shared-utils';
import { ElementPosition } from 'protocol';
import { ComponentTreeNode } from './component-tree';

interface ConsoleReferenceNode {
  node: ComponentTreeNode | null;
  position: ElementPosition;
}

declare const ng: any;

const CONSOLE_REFERENCE_PREFIX = '$ng';
const CAPACITY = 5;

const nodesForConsoleReference: ConsoleReferenceNode[] = [];

export const setConsoleReference = (referenceNode: ConsoleReferenceNode) => {
  if (referenceNode.node === null) {
    return;
  }
  _setConsoleReference(referenceNode);
};

const _setConsoleReference = (referenceNode: ConsoleReferenceNode) => {
  prepareCurrentReferencesForInsertion(referenceNode);
  nodesForConsoleReference.unshift(referenceNode);
  assignConsoleReferencesFrom(nodesForConsoleReference);
};

const prepareCurrentReferencesForInsertion = (referenceNode: ConsoleReferenceNode) => {
  const foundIndex = nodesForConsoleReference.findIndex(nodeToLookFor =>
    arrayEquals(nodeToLookFor.position, referenceNode.position)
  );
  if (foundIndex !== -1) {
    nodesForConsoleReference.splice(foundIndex, 1);
  } else if (nodesForConsoleReference.length === CAPACITY) {
    nodesForConsoleReference.pop();
  }
};

const assignConsoleReferencesFrom = (referenceNodes: ConsoleReferenceNode[]) => {
  referenceNodes.forEach((referenceNode, index) =>
    setDirectiveKey(referenceNode.node, getConsoleReferenceWithIndexOf(index))
  );
};

const setDirectiveKey = (node: ComponentTreeNode | null, key) => {
  Object.defineProperty(window, key, {
    get: () => {
      if (node && node.nativeElement instanceof HTMLElement) {
        return ng.getComponent(node.nativeElement) || node;
      }
      if (node) {
        return node.nativeElement;
      }
      return node;
    },
    configurable: true,
  });
};

const getConsoleReferenceWithIndexOf = (consoleReferenceIndex: number) =>
  `${CONSOLE_REFERENCE_PREFIX}${consoleReferenceIndex}`;
