import { getDirectiveForest, ComponentTreeNode } from './component-tree';
import { runOutsideAngular, componentMetadata } from './utils';

let hookInitialized = false;
export const onChangeDetection = (callback: () => void) => {
  if (hookInitialized) {
    return;
  }
  const forest = getDirectiveForest();
  listenAndNotifyOnUpdates(forest, callback);
  hookInitialized = true;
};

// We patch the component tView template function reference
// to detect when the change detection has completed and notify the client.
const listenAndNotifyOnUpdates = (roots: ComponentTreeNode[], callback: () => void) => {
  roots.forEach(root => {
    const { component } = root;
    if (!component) {
      console.warn('Could not find component instance on root');
      return;
    }
    const { instance } = component;
    const metadata = componentMetadata(instance);
    const bak = metadata.template;
    metadata.tView.template = function() {
      bak.apply(this, arguments);
      runOutsideAngular(() => {
        setTimeout(() => callback, 0);
      });
    };
  });
};
