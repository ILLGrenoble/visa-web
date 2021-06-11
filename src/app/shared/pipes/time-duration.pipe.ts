import {Pipe, PipeTransform} from '@angular/core';

import * as moment from 'moment';
import 'moment-duration-format';

@Pipe({name: 'timeDuration'})
export class TimeDurationPipe implements PipeTransform {
    public transform(value: any, ...args: string[]): string {
        if (typeof args === 'undefined' || args.length !== 1) {
            throw new Error('TimeDurationPipe: missing required time unit argument');
        }
        if (args[0] === 'date') {
            return moment(value).fromNow();
        }
        // return moment.duration(value, args[0] as moment.unitOfTime.DurationConstructor).format('h [hrs], m [min] [and] s [seconds]');
        return moment.duration(value, args[0] as moment.unitOfTime.DurationConstructor).humanize();
    }
}
