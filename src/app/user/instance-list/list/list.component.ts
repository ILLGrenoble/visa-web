import {Component, Input, Output} from '@angular/core';
import {Instance} from '@core';
import {Subject} from 'rxjs';

@Component({
    selector: 'visa-instance-list',
    templateUrl: './list.component.html',
    styleUrls: ['./list.component.scss'],
})
export class ListComponent {

    @Output()
    public doUpdateParent: Subject<null> = new Subject();

    private _instances: Instance[];

    get instances(): Instance[] {
        return this._instances;
    }

    @Input()
    set instances(value: Instance[]) {
        this._instances = value || [];
    }

    constructor() {
    }

    public updateList(): void {
        this.doUpdateParent.next(null);
    }

}
