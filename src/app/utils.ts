import { DeepProxy } from '@qiwi/deep-proxy';
import { EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs';
import { THandlerContext } from '@qiwi/deep-proxy';

// 👇 wrapper for DeepProxy to substitute CSS variables for
//    equivalent properties
export class CSSVariableProxy<T = any> {
  baseName: string;

  #host: HTMLElement;
  #styles: CSSStyleDeclaration;

  constructor(host: HTMLElement, baseName: string) {
    this.baseName = baseName;
    this.#host = host;
    this.#styles = getComputedStyle(this.#host);
    // 👇 this is the polyfill that propagates a DeepProxy through
    //    Object.assign, as required by WaveSurfer
    if (typeof Object['__assign__'] != 'function') {
      Object['__assign__'] = Object.assign;
      Object.assign = function (target, ...varArgs): Object {
        let proxy;
        for (const arg of varArgs) proxy = arg?.__DEEP_PROXY__;
        Object['__assign__'](target, ...varArgs);
        return proxy ? proxy.proxyFactory(target) : target;
      };
    }
  }

  proxyFactory(target: any): T {
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
          if (key === '__DEEP_PROXY__') return this;
          if (
            typeof value === 'object' &&
            value !== null &&
            !(value instanceof Element)
          )
            return PROXY;
          const nm = path.length
            ? `--${this.baseName}-${path.join('-')}-${String(key)}`
            : `--${this.baseName}-${String(key)}`;
          value = this.#styles.getPropertyValue(nm);
          // 👉 this is the CSS variable corresponding to the value
          if (value) return value;
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
