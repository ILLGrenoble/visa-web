import {Component, Input, Output} from '@angular/core';
import {Configuration, Instance} from '@core';
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

    private _configuration: Configuration;

    get instances(): Instance[] {
        return this._instances;
    }

    @Input()
    set instances(value: Instance[]) {
        this._instances = value || [];
    }

    get configuration(): Configuration {
        return this._configuration;
    }

    @Input()
    set configuration(value: Configuration) {
        this._configuration = value;
    }

    constructor() {
    }

    public updateList(): void {
        this.doUpdateParent.next(null);
    }

}
