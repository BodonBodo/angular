library angular.core.facade.async;

import 'dart:async';
export 'dart:async' show Future;

class PromiseWrapper {
  static Future resolve(obj) {
    return new Future.value(obj);
  }

  static Future reject(obj) {
    return new Future.error(obj);
  }

  static Future<List> all(List<Future> promises) {
    return Future.wait(promises);
  }

  static Future then(Future promise, Function success, Function onError) {
    if (success == null) return promise.catchError(onError);
    return promise.then(success, onError: onError);
  }

  static completer(){
    return new _Completer(new Completer());
  }

  static setTimeout(Function fn, int millis) {
    new Timer(new Duration(milliseconds: millis), fn);
  }
}

class _Completer {
  Completer c;

  _Completer(this.c);

  get promise => c.future;

  complete(v) {
    c.complete(v);
  }

  reject(v) {
    c.completeError(v);
  }
}
