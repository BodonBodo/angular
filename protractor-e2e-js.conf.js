var config = exports.config = require('./protractor-e2e-shared.js').config;
config.baseUrl = 'http://localhost:8001/';

// TODO: remove exclusion when JS verison of scrolling benchmark is available
config.exclude = config.exclude || [];
config.exclude.push('dist/js/cjs/benchmarks_external/e2e_test/naive_infinite_scroll_spec.js');
