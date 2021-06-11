import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'randomItem'})
export class RandomItemPipe implements PipeTransform {
    public transform(list: Array<string>): string {
        return list[Math.floor(Math.random() * list.length)];
    }
}
