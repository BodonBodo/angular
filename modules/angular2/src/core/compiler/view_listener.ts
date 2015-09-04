import {Injectable} from 'angular2/src/core/di';
import * as viewModule from './view';

/**
 * Listener for view creation / destruction.
 */
@Injectable()
export class AppViewListener {
  viewCreated(view: viewModule.AppView) {}
  viewDestroyed(view: viewModule.AppView) {}
}
