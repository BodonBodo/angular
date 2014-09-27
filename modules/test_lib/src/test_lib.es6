export var describe = window.describe;
export var it = window.it;
export var beforeEach = window.beforeEach;
export var afterEach = window.afterEach;
export var expect = window.expect;

// To make testing consistent between dart and js
window.print = function(msg) {
  if (window.dump) {
    window.dump(msg);
  } else {
    window.console.log(msg);
  }
};
