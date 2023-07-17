import { AfterViewInit } from '@angular/core';
import { Directive } from '@angular/core';
import { ElementRef } from '@angular/core';
import { HostListener } from '@angular/core';
import { OnDestroy } from '@angular/core';
import { OnInit } from '@angular/core';
import { WINDOW } from '@ng-web-apis/common';

import { inject } from '@angular/core';

// 👇 this directive adds drag/drop to tui-input-tag

//    yes -- I know its name should be more specific, but this is MY
//    codebase and I'll call it what I want!

//    yes -- I know I shouldn't be doing all this backdoor DOM
//    maanipulation, but I'm hacking

@Directive({
  selector: 'tui-input-tag[mmDragDroppable][tuiTextfieldLabelOutside]'
})
export class DragDroppableDirective
  implements AfterViewInit, OnInit, OnDestroy
{
  #el = inject(ElementRef);
  #observer = new MutationObserver(this.observant.bind(this));
  #onDragStart = this.onDragStart.bind(this);
  #window = inject(WINDOW);

  // 👇 drop zone listeners

  @HostListener('dragover', ['$event']) onDragOver(event): void {
    event.preventDefault();
  }

  @HostListener('drop', ['$event']) onDrop(event): void {
    event.preventDefault();
  }

  ngAfterViewInit(): void {
    const wrappers = this.#window.document.querySelectorAll(
      'tui-input-tag div[tuiwrapper]'
    );
    Array.from(wrappers).forEach((wrapper: any) => {
      const problems = wrapper.getEventListeners('mousedown') ?? [];
      problems.forEach((problem) =>
        wrapper.removeEventListener(
          problem.type,
          problem.listener,
          problem.capture
        )
      );
    });
  }

  ngOnDestroy(): void {
    this.#observer.disconnect();
  }

  ngOnInit(): void {
    this.#observer.observe(this.#el.nativeElement, {
      childList: true,
      subtree: true
    });
  }

  observant(mutationList: MutationRecord[]): void {
    // 👇 what tui-tags have been added/removed?
    const { added, removed } = mutationList.reduce(
      (acc, mutation) => {
        const onlyTags = (node: HTMLElement): boolean =>
          node.tagName?.toUpperCase() === 'TUI-TAG';
        acc.added.push(...Array.from(mutation.addedNodes).filter(onlyTags));
        acc.removed.push(...Array.from(mutation.removedNodes).filter(onlyTags));
        return acc;
      },
      { added: [], removed: [] }
    );
    // 👇 make each new tui-tag draggable
    added.forEach((tag) => {
      tag.draggable = 'true';
      tag.addEventListener('dragstart', this.#onDragStart);
    });
    removed.forEach((tag) => {
      tag.removeEventListener('dragstart', this.#onDragStart);
    });
  }

  // 👇 draggable tag listener

  onDragStart(event): void {
    event.dataTransfer.setData('text/plain', event.target.innerText);
  }
}
