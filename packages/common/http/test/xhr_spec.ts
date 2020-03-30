/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {HttpRequest} from '@angular/common/http/src/request';
import {HttpDownloadProgressEvent, HttpErrorResponse, HttpEvent, HttpEventType, HttpHeaderResponse, HttpResponse, HttpResponseBase, HttpUploadProgressEvent} from '@angular/common/http/src/response';
import {HttpXhrBackend} from '@angular/common/http/src/xhr';
import {ddescribe, describe, fit, it} from '@angular/core/testing/src/testing_internal';
import {Observable} from 'rxjs';
import {toArray} from 'rxjs/operators';

import {MockXhrFactory} from './xhr_mock';

function trackEvents(obs: Observable<HttpEvent<any>>): HttpEvent<any>[] {
  const events: HttpEvent<any>[] = [];
  obs.subscribe(event => events.push(event), err => events.push(err));
  return events;
}

const TEST_POST = new HttpRequest('POST', '/test', 'some body', {
  responseType: 'text',
});

const XSSI_PREFIX = ')]}\'\n';

{
  describe('XhrBackend', () => {
    let factory: MockXhrFactory = null!;
    let backend: HttpXhrBackend = null!;
    beforeEach(() => {
      factory = new MockXhrFactory();
      backend = new HttpXhrBackend(factory);
    });
    it('emits status immediately', () => {
      const events = trackEvents(backend.handle(TEST_POST));
      expect(events.length).toBe(1);
      expect(events[0].type).toBe(HttpEventType.Sent);
    });
    it('sets method, url, and responseType correctly', () => {
      backend.handle(TEST_POST).subscribe();
      expect(factory.mock.method).toBe('POST');
      expect(factory.mock.responseType).toBe('text');
      expect(factory.mock.url).toBe('/test');
    });
    it('sets outgoing body correctly', () => {
      backend.handle(TEST_POST).subscribe();
      expect(factory.mock.body).toBe('some body');
    });
    it('sets outgoing headers, including default headers', () => {
      const post = TEST_POST.clone({
        setHeaders: {
          'Test': 'Test header',
        },
      });
      backend.handle(post).subscribe();
      expect(factory.mock.mockHeaders).toEqual({
        'Test': 'Test header',
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'text/plain',
      });
    });
    it('sets outgoing headers, including overriding defaults', () => {
      const setHeaders = {
        'Test': 'Test header',
        'Accept': 'text/html',
        'Content-Type': 'text/css',
      };
      backend.handle(TEST_POST.clone({setHeaders})).subscribe();
      expect(factory.mock.mockHeaders).toEqual(setHeaders);
    });
    it('passes withCredentials through', () => {
      backend.handle(TEST_POST.clone({withCredentials: true})).subscribe();
      expect(factory.mock.withCredentials).toBe(true);
    });
    it('handles a text response', () => {
      const events = trackEvents(backend.handle(TEST_POST));
      factory.mock.mockFlush(200, 'OK', 'some response');
      expect(events.length).toBe(2);
      expect(events[1].type).toBe(HttpEventType.Response);
      expect(events[1] instanceof HttpResponse).toBeTruthy();
      const res = events[1] as HttpResponse<string>;
      expect(res.body).toBe('some response');
      expect(res.status).toBe(200);
      expect(res.statusText).toBe('OK');
    });
    it('handles a json response', () => {
      const events = trackEvents(backend.handle(TEST_POST.clone({responseType: 'json'})));
      factory.mock.mockFlush(200, 'OK', JSON.stringify({data: 'some data'}));
      expect(events.length).toBe(2);
      const res = events[1] as HttpResponse<{data: string}>;
      expect(res.body!.data).toBe('some data');
    });
    it('handles a blank json response', () => {
      const events = trackEvents(backend.handle(TEST_POST.clone({responseType: 'json'})));
      factory.mock.mockFlush(200, 'OK', '');
      expect(events.length).toBe(2);
      const res = events[1] as HttpResponse<{data: string}>;
      expect(res.body).toBeNull();
    });
    it('handles a json error response', () => {
      const events = trackEvents(backend.handle(TEST_POST.clone({responseType: 'json'})));
      factory.mock.mockFlush(500, 'Error', JSON.stringify({data: 'some data'}));
      expect(events.length).toBe(2);
      const res = events[1] as any as HttpErrorResponse;
      expect(res.error!.data).toBe('some data');
    });
    it('handles a json error response with XSSI prefix', () => {
      const events = trackEvents(backend.handle(TEST_POST.clone({responseType: 'json'})));
      factory.mock.mockFlush(500, 'Error', XSSI_PREFIX + JSON.stringify({data: 'some data'}));
      expect(events.length).toBe(2);
      const res = events[1] as any as HttpErrorResponse;
      expect(res.error!.data).toBe('some data');
    });
    it('handles a json string response', () => {
      const events = trackEvents(backend.handle(TEST_POST.clone({responseType: 'json'})));
      expect(factory.mock.responseType).toEqual('text');
      factory.mock.mockFlush(200, 'OK', JSON.stringify('this is a string'));
      expect(events.length).toBe(2);
      const res = events[1] as HttpResponse<string>;
      expect(res.body).toEqual('this is a string');
    });
    it('handles a json response with an XSSI prefix', () => {
      const events = trackEvents(backend.handle(TEST_POST.clone({responseType: 'json'})));
      factory.mock.mockFlush(200, 'OK', XSSI_PREFIX + JSON.stringify({data: 'some data'}));
      expect(events.length).toBe(2);
      const res = events[1] as HttpResponse<{data: string}>;
      expect(res.body!.data).toBe('some data');
    });
    it('emits unsuccessful responses via the error path', done => {
      backend.handle(TEST_POST).subscribe(undefined, (err: HttpErrorResponse) => {
        expect(err instanceof HttpErrorResponse).toBe(true);
        expect(err.error).toBe('this is the error');
        done();
      });
      factory.mock.mockFlush(400, 'Bad Request', 'this is the error');
    });
    it('emits real errors via the error path', done => {
      backend.handle(TEST_POST).subscribe(undefined, (err: HttpErrorResponse) => {
        expect(err instanceof HttpErrorResponse).toBe(true);
        expect(err.error instanceof Error).toBeTrue();
        expect(err.url).toBe('/test');
        done();
      });
      factory.mock.mockErrorEvent(new Error('blah'));
    });
    describe('progress events', () => {
      it('are emitted for download progress', done => {
        backend.handle(TEST_POST.clone({reportProgress: true}))
            .pipe(toArray())
            .subscribe(events => {
              expect(events.map(event => event.type)).toEqual([
                HttpEventType.Sent,
                HttpEventType.ResponseHeader,
                HttpEventType.DownloadProgress,
                HttpEventType.DownloadProgress,
                HttpEventType.Response,
              ]);
              const [progress1, progress2, response] = [
                events[2] as HttpDownloadProgressEvent, events[3] as HttpDownloadProgressEvent,
                events[4] as HttpResponse<string>
              ];
              expect(progress1.partialText).toBe('down');
              expect(progress1.loaded).toBe(100);
              expect(progress1.total).toBe(300);
              expect(progress2.partialText).toBe('download');
              expect(progress2.loaded).toBe(200);
              expect(progress2.total).toBe(300);
              expect(response.body).toBe('downloaded');
              done();
            });
        factory.mock.responseText = 'down';
        factory.mock.mockDownloadProgressEvent(100, 300);
        factory.mock.responseText = 'download';
        factory.mock.mockDownloadProgressEvent(200, 300);
        factory.mock.mockFlush(200, 'OK', 'downloaded');
      });
      it('are emitted for upload progress', done => {
        backend.handle(TEST_POST.clone({reportProgress: true}))
            .pipe(toArray())
            .subscribe(events => {
              expect(events.map(event => event.type)).toEqual([
                HttpEventType.Sent,
                HttpEventType.UploadProgress,
                HttpEventType.UploadProgress,
                HttpEventType.Response,
              ]);
              const [progress1, progress2] = [
                events[1] as HttpUploadProgressEvent,
                events[2] as HttpUploadProgressEvent,
              ];
              expect(progress1.loaded).toBe(100);
              expect(progress1.total).toBe(300);
              expect(progress2.loaded).toBe(200);
              expect(progress2.total).toBe(300);
              done();
            });
        factory.mock.mockUploadProgressEvent(100, 300);
        factory.mock.mockUploadProgressEvent(200, 300);
        factory.mock.mockFlush(200, 'OK', 'Done');
      });
      it('are emitted when both upload and download progress are available', done => {
        backend.handle(TEST_POST.clone({reportProgress: true}))
            .pipe(toArray())
            .subscribe(events => {
              expect(events.map(event => event.type)).toEqual([
                HttpEventType.Sent,
                HttpEventType.UploadProgress,
                HttpEventType.ResponseHeader,
                HttpEventType.DownloadProgress,
                HttpEventType.Response,
              ]);
              done();
            });
        factory.mock.mockUploadProgressEvent(100, 300);
        factory.mock.mockDownloadProgressEvent(200, 300);
        factory.mock.mockFlush(200, 'OK', 'Done');
      });
      it('are emitted even if length is not computable', done => {
        backend.handle(TEST_POST.clone({reportProgress: true}))
            .pipe(toArray())
            .subscribe(events => {
              expect(events.map(event => event.type)).toEqual([
                HttpEventType.Sent,
                HttpEventType.UploadProgress,
                HttpEventType.ResponseHeader,
                HttpEventType.DownloadProgress,
                HttpEventType.Response,
              ]);
              done();
            });
        factory.mock.mockUploadProgressEvent(100);
        factory.mock.mockDownloadProgressEvent(200);
        factory.mock.mockFlush(200, 'OK', 'Done');
      });
      it('include ResponseHeader with headers and status', done => {
        backend.handle(TEST_POST.clone({reportProgress: true}))
            .pipe(toArray())
            .subscribe(events => {
              expect(events.map(event => event.type)).toEqual([
                HttpEventType.Sent,
                HttpEventType.ResponseHeader,
                HttpEventType.DownloadProgress,
                HttpEventType.Response,
              ]);
              const partial = events[1] as HttpHeaderResponse;
              expect(partial.headers.get('Content-Type')).toEqual('text/plain');
              expect(partial.headers.get('Test')).toEqual('Test header');
              done();
            });
        factory.mock.mockResponseHeaders = 'Test: Test header\nContent-Type: text/plain\n';
        factory.mock.mockDownloadProgressEvent(200);
        factory.mock.mockFlush(200, 'OK', 'Done');
      });
      it('are unsubscribed along with the main request', () => {
        const sub = backend.handle(TEST_POST.clone({reportProgress: true})).subscribe();
        expect(factory.mock.listeners.progress).not.toBeUndefined();
        sub.unsubscribe();
        expect(factory.mock.listeners.progress).toBeUndefined();
      });
      it('do not cause headers to be re-parsed on main response', done => {
        backend.handle(TEST_POST.clone({reportProgress: true}))
            .pipe(toArray())
            .subscribe(events => {
              events
                  .filter(
                      event => event.type === HttpEventType.Response ||
                          event.type === HttpEventType.ResponseHeader)
                  .map(event => event as HttpResponseBase)
                  .forEach(event => {
                    expect(event.status).toBe(203);
                    expect(event.headers.get('Test')).toEqual('This is a test');
                  });
              done();
            });
        factory.mock.mockResponseHeaders = 'Test: This is a test\n';
        factory.mock.status = 203;
        factory.mock.mockDownloadProgressEvent(100, 300);
        factory.mock.mockResponseHeaders = 'Test: should never be read\n';
        factory.mock.mockFlush(203, 'OK', 'Testing 1 2 3');
      });
    });
    describe('gets response URL', () => {
      it('from XHR.responsesURL', done => {
        backend.handle(TEST_POST).pipe(toArray()).subscribe(events => {
          expect(events.length).toBe(2);
          expect(events[1].type).toBe(HttpEventType.Response);
          const response = events[1] as HttpResponse<string>;
          expect(response.url).toBe('/response/url');
          done();
        });
        factory.mock.responseURL = '/response/url';
        factory.mock.mockFlush(200, 'OK', 'Test');
      });
      it('from X-Request-URL header if XHR.responseURL is not present', done => {
        backend.handle(TEST_POST).pipe(toArray()).subscribe(events => {
          expect(events.length).toBe(2);
          expect(events[1].type).toBe(HttpEventType.Response);
          const response = events[1] as HttpResponse<string>;
          expect(response.url).toBe('/response/url');
          done();
        });
        factory.mock.mockResponseHeaders = 'X-Request-URL: /response/url\n';
        factory.mock.mockFlush(200, 'OK', 'Test');
      });
      it('falls back on Request.url if neither are available', done => {
        backend.handle(TEST_POST).pipe(toArray()).subscribe(events => {
          expect(events.length).toBe(2);
          expect(events[1].type).toBe(HttpEventType.Response);
          const response = events[1] as HttpResponse<string>;
          expect(response.url).toBe('/test');
          done();
        });
        factory.mock.mockFlush(200, 'OK', 'Test');
      });
    });
    describe('corrects for quirks', () => {
      it('by normalizing 1223 status to 204', done => {
        backend.handle(TEST_POST).pipe(toArray()).subscribe(events => {
          expect(events.length).toBe(2);
          expect(events[1].type).toBe(HttpEventType.Response);
          const response = events[1] as HttpResponse<string>;
          expect(response.status).toBe(204);
          done();
        });
        factory.mock.mockFlush(1223, 'IE Special Status', 'Test');
      });
      it('by normalizing 0 status to 200 if a body is present', done => {
        backend.handle(TEST_POST).pipe(toArray()).subscribe(events => {
          expect(events.length).toBe(2);
          expect(events[1].type).toBe(HttpEventType.Response);
          const response = events[1] as HttpResponse<string>;
          expect(response.status).toBe(200);
          done();
        });
        factory.mock.mockFlush(0, 'CORS 0 status', 'Test');
      });
      it('by leaving 0 status as 0 if a body is not present', done => {
        backend.handle(TEST_POST).pipe(toArray()).subscribe(
            undefined, (error: HttpErrorResponse) => {
              expect(error.status).toBe(0);
              done();
            });
        factory.mock.mockFlush(0, 'CORS 0 status');
      });
    });
  });
}
