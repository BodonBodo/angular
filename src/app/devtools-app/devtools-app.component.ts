import { Component, ViewChild, ElementRef } from '@angular/core';
import { IFrameMessageBus } from 'src/iframe-message-bus';
import { MessageBus, Events } from 'protocol';

@Component({
  templateUrl: './devtools-app.component.html',
  styleUrls: ['./devtools-app.component.css'],
  providers: [
    {
      provide: MessageBus,
      useFactory(): MessageBus<Events> {
        return new IFrameMessageBus(
          'angular-devtools',
          'angular-devtools-backend',
          // tslint:disable-next-line: no-non-null-assertion
          () => (document.querySelector('#sample-app') as HTMLIFrameElement).contentWindow!
        ) as any;
      },
    },
  ],
})
export class DevToolsComponent {
  messageBus: IFrameMessageBus | null = null;
  @ViewChild('ref') iframe: ElementRef;
}
