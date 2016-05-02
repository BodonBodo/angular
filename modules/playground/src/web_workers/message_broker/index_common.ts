import {PromiseWrapper} from '@angular/facade';
import {Component} from '@angular/core';
import {
  ServiceMessageBrokerFactory,
  PRIMITIVE
} from '../../../../@angular/platform-browser/src/worker_app';

const ECHO_CHANNEL = "ECHO";

@Component({selector: 'app', template: "<h1>WebWorker MessageBroker Test</h1>"})
export class App {
  constructor(private _serviceBrokerFactory: ServiceMessageBrokerFactory) {
    var broker = _serviceBrokerFactory.createMessageBroker(ECHO_CHANNEL, false);
    broker.registerMethod("echo", [PRIMITIVE], this._echo, PRIMITIVE);
  }

  private _echo(val: string) {
    return PromiseWrapper.wrap(() => { return val; });
  }
}
