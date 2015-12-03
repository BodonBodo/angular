import {platform} from "angular2/core";
import {WORKER_APP_PLATFORM, setupWebWorker} from "angular2/platform/worker_app";
import {App} from "./index_common";

export function main() {
  platform([WORKER_APP_PLATFORM])
      .asyncApplication(setupWebWorker)
      .then((ref) => ref.bootstrap(App));
}
