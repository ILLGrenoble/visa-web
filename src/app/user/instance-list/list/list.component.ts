import {Component, Input, OnInit, Output} from '@angular/core';
import {BookingToken, Configuration, Instance} from '@core';
import {Subject} from 'rxjs';

type InstanceAndToken = {
    instance: Instance;
    token?: BookingToken;
}

@Component({
    selector: 'visa-instance-list',
    templateUrl: './list.component.html',
    styleUrls: ['./list.component.scss'],
})
export class ListComponent {

    @Output()
    public doUpdateParent: Subject<null> = new Subject();

    private _instances: Instance[] = [];
    private _bookingTokens: BookingToken[];
    private _instancesAndTokens: InstanceAndToken[];

    private _configuration: Configuration;

    get instancesAndTokens(): InstanceAndToken[] {
        return this._instancesAndTokens;
    }

    @Input()
    set instances(value: Instance[]) {
        this._instances = value || [];
        this._updateInstancesAndTokens();
    }

    @Input()
    set bookingTokens(value: BookingToken[]) {
        this._bookingTokens = value;
        this._updateInstancesAndTokens();
    }

    get configuration(): Configuration {
        return this._configuration;
    }

    @Input()
    set configuration(value: Configuration) {
        this._configuration = value;
    }

    public updateList(): void {
        this.doUpdateParent.next(null);
    }

    private _updateInstancesAndTokens(): void {
        this._instancesAndTokens = this._instances.map(instance => {
            return {
                instance: instance,
                token: this._bookingTokens?.find(token => token.instance?.id === instance.id),
            }
        })
    }
}
