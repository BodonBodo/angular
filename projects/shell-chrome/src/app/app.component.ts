import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { panelDevTools } from '../panel-devtools';
import { MessageBus, Events } from 'protocol';
import { ZoneAwareChromeMessageBus } from './zone-aware-chrome-message-bus';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  messageBus: MessageBus<Events> | null;

  constructor(private _cd: ChangeDetectorRef, private _ngZone: NgZone) {}

  ngOnInit(): void {
    console.log('Initializing the devtools');

    const cleanup = () => {
      console.log('Cleaning up');
      if (this.messageBus) {
        this.messageBus.destroy();
        this.messageBus = null;
      }
    };

    const initialize = () => {
      console.log('Initialize the port');
      const port = chrome.runtime.connect({
        name: '' + chrome.devtools.inspectedWindow.tabId
      });
      this.messageBus = new ZoneAwareChromeMessageBus(port, this._ngZone);
      panelDevTools.injectBackend();
      this._cd.detectChanges();
    };

    const reload = () => {
      cleanup();
      initialize();
    };

    panelDevTools.onReload(reload);
    initialize();
  }
}
