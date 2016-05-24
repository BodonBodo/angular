export { Router } from './src/router';
export { UrlSerializer, DefaultUrlSerializer } from './src/url_serializer';
export { RouterState, ActivatedRoute } from './src/router_state';
export { RouterOutletMap } from './src/router_outlet_map';

import { RouterOutlet } from './src/directives/router_outlet';
import { RouterLink } from './src/directives/router_link';

export const ROUTER_DIRECTIVES = [RouterOutlet, RouterLink];