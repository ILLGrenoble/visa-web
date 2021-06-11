import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'timeConversion'})
export class TimeConversionPipe implements PipeTransform {
    public transform(value: any): string {
        return new Date(value * 1000).toISOString().substr(11, 8);
    }
}
