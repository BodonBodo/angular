import { loadLegacyUrls, loadLocalSitemapUrls, loadSWRoutes } from '../shared/helpers';

// NOTE: The new `@angular/service-worker` does not support configurable routes.
xdescribe('service-worker routes', () => {

  loadLocalSitemapUrls().forEach(url => {
    it('should process URLs in the Sitemap', () => {
      const routes = loadSWRoutes();
      expect(routes.some(test => test(url))).toBeTruthy(url);
    });
  });

  loadLegacyUrls().forEach(urlPair => {
    const url = urlPair[0];
    it('should ignore legacy URLs that will be redirected', () => {
      const routes = loadSWRoutes();
      expect(routes.some(test => test(url))).toBeFalsy(url);
    });
  });

  it('should ignore stackblitz URLs', () => {
    const routes = loadSWRoutes();

    // Normal StackBlitz URLs.
    expect(routes.some(test => test('/generated/live-examples/toh-pt6/stackblitz.html'))).toBeFalsy();
    expect(routes.some(test => test('/generated/live-examples/toh-pt6/stackblitz'))).toBeFalsy();

    // Embedded StackBlitz URLs.
    expect(routes.some(test => test('/generated/live-examples/toh-pt6/stackblitz.html?ctl=1'))).toBeFalsy();
    expect(routes.some(test => test('/generated/live-examples/toh-pt6/stackblitz?ctl=1'))).toBeFalsy();
  });

  it('should ignore URLs to files with extensions', () => {
    const routes = loadSWRoutes();
    expect(routes.some(test => test('/generated/zips/animations/animations.zip'))).toBeFalsy();
    expect(routes.some(test => test('/generated/images/guide/animations/animation_auto.gif'))).toBeFalsy();
    expect(routes.some(test => test('/generated/ie-polyfills.min.js'))).toBeFalsy();
    expect(routes.some(test => test('/generated/docs/guide/animations.json'))).toBeFalsy();
  });
});
