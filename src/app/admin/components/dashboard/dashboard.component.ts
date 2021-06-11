import {Component} from '@angular/core';
import {BehaviorSubject, Subject} from 'rxjs';

@Component({
    selector: 'visa-admin-dashboard',
    templateUrl: './dashboard.component.html',
})
export class DashboardComponent {

    private _refreshEvent$: Subject<void> = new BehaviorSubject<void>(null);

    get refreshEvent$(): Subject<void> {
        return this._refreshEvent$;
    }

    set refreshEvent$(value: Subject<void>) {
        this._refreshEvent$ = value;
    }

    public handleRefresh($event: void): void {
        this._refreshEvent$.next();
    }

}
