import {HelloCmp} from './index_common';
import {bootstrapWorkerApp} from '@angular/platform-browser-dynamic';

export function main() {
  bootstrapWorkerApp(HelloCmp);
}
