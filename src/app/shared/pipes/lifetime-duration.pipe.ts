import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'lifetimeDuration'})
export class LifetimeDurationPipe implements PipeTransform {
    public transform(lifetimeMinutes: number): string {
        return formatDuration(lifetimeMinutes);
    }
}


function formatDuration(minutes: number): string {
    if (minutes == null || isNaN(minutes)) return '';
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const mins = minutes % 60;

    let result = '';
    if (days) result += `${days} days`;
    if (hours) result += `${hours} hours`;
    if (mins || (!days && !hours)) result += `${mins} minutes`;
    return result;
}
