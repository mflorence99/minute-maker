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

  fromControlValue(date: Date): DateTime {
    return date
      ? [TuiDay.fromLocalNativeDate(date), TuiTime.fromLocalNativeDate(date)]
      : null;
  }

  toControlValue([day, time]: DateTime): Date {
    return day && time
      ? dayjs(
          `${day.toString('YMD').replaceAll('.', '-')} ${time.toString()}`
        ).toDate()
      : null;
  }
}
