/* eslint-disable @typescript-eslint/naming-convention */
import { DeepProxy } from '@qiwi/deep-proxy';
import { EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs';
import { THandlerContext } from '@qiwi/deep-proxy';

// 👇 wrapper for DeepProxy to substitute CSS variables for
//    equivalent properties
export class CSSVariableProxy<T = any> {
  #host: HTMLElement;
  #styles: CSSStyleDeclaration;

  constructor(host: HTMLElement) {
    this.#host = host;
    this.#styles = getComputedStyle(this.#host);
  }

  proxyFactory(baseName: string, target: any): T {
    return new DeepProxy(
      target,
      ({
        trapName,
        value,
        key,
        path,
        DEFAULT,
        PROXY
      }: THandlerContext<any>) => {
        if (trapName === 'get') {
          if (
            typeof value === 'object' &&
            value !== null &&
            !(value instanceof Element)
          )
            return PROXY;
          const nm = path.length
            ? `--${baseName}-${path.join('-')}-${String(key)}`
            : `--${baseName}-${String(key)}`;
          const prop = this.#styles.getPropertyValue(nm);
          if (prop) return prop;
        }
        return DEFAULT;
      }
    );
  }
}

// 🙈 https://stackoverflow.com/questions/33441393/is-there-a-way-to-check-for-output-wire-up-from-within-a-component-in-angular
export class WatchableEventEmitter<T> extends EventEmitter<T> {
  subscriberCount = 0;

  override subscribe(
    next?: (value: any) => void,
    error?: (error: any) => void,
    complete?: () => void
  ): Subscription {
    ++this.subscriberCount;
    return super.subscribe(next, error, complete);
  }

  override unsubscribe(): void {
    --this.subscriberCount;
    super.unsubscribe();
  }
}

// 🙈 https://stackoverflow.com/questions/63116039/camelcase-to-kebab-case
export function kebabasize(camelCase): string {
  return camelCase.replace(
    /[A-Z]+(?![a-z])|[A-Z]/g,
    ($: string, ofs) => (ofs ? '-' : '') + $.toLowerCase()
  );
}
