import { Constants } from '#mm/common';
import { EventManager } from '@angular/platform-browser';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { throttleTime } from 'rxjs';

// 🙈 https://indepth.dev/posts/1153/supercharge-event-management-in-your-angular-application

// 🟦 example:  <input (input.throttled.250) ...

@Injectable()
export class ThrottledEventPlugin {
  manager!: EventManager;

  addEventListener(
    element: HTMLElement,
    event: string,
    handler: Function
  ): Function {
    // 👇 isolate the components of the event name
    const [baseEvent, , throttleInterval = Constants.throttledEventInterval] =
      event.split('.');
    // 👇 we'll pump events through thus Observable
    const event$ = new Subject<Event>();
    // 👇 subscribe to events and throttle them, calling original handler
    const subscription = event$
      .pipe(
        throttleTime(Number(throttleInterval), undefined, {
          leading: true,
          trailing: true
        })
      )
      .subscribe((event) => handler(event));
    // 👇 delegate event setup to manager
    const teardown = this.manager.addEventListener(
      element,
      baseEvent,
      (event: Event): void => {
        event$.next(event);
      }
    );
    // 👇 we need to unsubscribe as we teardown
    return () => {
      subscription.unsubscribe();
      teardown();
    };
  }

  supports(event: string): boolean {
    return event.split('.').includes('throttled');
  }
}
