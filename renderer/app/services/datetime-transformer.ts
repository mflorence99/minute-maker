import { AbstractTuiValueTransformer } from '@taiga-ui/cdk';
import { Injectable } from '@angular/core';
import { TuiDay } from '@taiga-ui/cdk';
import { TuiTime } from '@taiga-ui/cdk';

import dayjs from 'dayjs';

type DateTime = [TuiDay | null, TuiTime | null];

@Injectable()
export class DateTimeTransformer extends AbstractTuiValueTransformer<
  DateTime,
  Date
> {
  //

  fromControlValue(controlValue: Date): DateTime {
    const from = controlValue ?? new Date();
    return [
      TuiDay.fromLocalNativeDate(from),
      TuiTime.fromLocalNativeDate(from)
    ];
  }

  toControlValue([day, time]: DateTime): Date {
    return day && time
      ? dayjs(
          `${day.toString('YMD').replaceAll('.', '-')} ${time.toString()}`
        ).toDate()
      : null;
  }
}
