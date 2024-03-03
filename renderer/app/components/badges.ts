import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ConfigStateModel } from '#mm/state/config';
import { ControllerService } from '#mm/services/controller';
import { FormControl } from '@angular/forms';
import { FormGroup } from '@angular/forms';
import { Minutes } from '#mm/common';
import { OnInit } from '@angular/core';
import { SetMinutes } from '#mm/state/minutes';
import { StatusStateModel } from '#mm/state/status';
import { Store } from '@ngxs/store';
import { UpdateChanges as UpdateConfigChanges } from '#mm/state/config';

import { effect } from '@angular/core';
import { inject } from '@angular/core';
import { input } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mm-badges',
  template: `
    <form [formGroup]="badgesForm">
      <article class="badges">
        @for (badge of minutes().badges; track ix; let ix = $index) {
          <article
            [ngClass]="{ badge: true, multi: minutes().badges.length > 1 }">
            <img src="data:image/png;base64,{{ badge }}" />
            <tui-radio [item]="ix" formControlName="badgeNum" size="l" />
          </article>
        }
      </article>

      <article>
        <label tuiLabel="Badge generation prompt">
          <tui-text-area
            [expandable]="true"
            formControlName="badgeGenerationPrompt"
            size="m" />
        </label>
      </article>
    </form>

    <tui-loader [showLoader]="status().working?.on === 'badge'">
      <button
        (click)="generateBadges()"
        [appearance]="status().working?.on === 'badge' ? 'mono' : 'primary'"
        size="m"
        tuiButton>
        Generate Badges
      </button>
    </tui-loader>
  `,
  styles: [
    `
      .badges {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        gap: 1rem;

        .badge {
          height: 100%;
          position: relative;
          width: 100%;
        }

        .badge.multi {
          height: calc(50% - 0.5rem);
          width: calc(50% - 0.5rem);
        }

        img {
          height: 100%;
          width: 100%;
        }

        tui-radio {
          background-color: white;
          left: 1rem;
          padding: 0.25rem;
          position: absolute;
          top: 1rem;
        }
      }

      tui-loader {
        margin-top: 1rem;
        text-align: center;
      }
    `
  ]
})
export class BadgesComponent implements OnInit {
  badgesForm: FormGroup;
  config = input.required<ConfigStateModel>();
  minutes = input.required<Minutes>();
  status = input.required<StatusStateModel>();

  #controller = inject(ControllerService);
  #store = inject(Store);

  constructor() {
    // 👇 watch for changes in inputs and update accordingly
    effect(() => {
      this.badgesForm?.patchValue(
        { ...this.config(), ...this.minutes() },
        { emitEvent: false }
      );
    });
  }

  generateBadges(): void {
    this.#controller.generateBadges();
  }

  ngOnInit(): void {
    // 👇 create the form
    this.badgesForm = new FormGroup({
      badgeGenerationPrompt: new FormControl(
        this.config().badgeGenerationPrompt
      ),
      badgeNum: new FormControl(this.minutes().badgeNum)
    });
    // 👇 watch for changes in form and update accordingly
    this.badgesForm.valueChanges.subscribe((changes) => {
      this.#store.dispatch([
        new UpdateConfigChanges({
          badgeGenerationPrompt: changes.badgeGenerationPrompt
        }),
        new SetMinutes({ badgeNum: changes.badgeNum })
      ]);
    });
  }
}
