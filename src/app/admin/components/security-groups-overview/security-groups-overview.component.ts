import {Component, ViewEncapsulation} from '@angular/core';
import {Subject} from 'rxjs';

@Component({
    selector: 'visa-admin-security-groups-overview',
    templateUrl: './security-groups-overview.component.html',
    encapsulation: ViewEncapsulation.None,
    styleUrls: ['./security-groups-overview.component.scss']
})

export class SecurityGroupsOverviewComponent {

    private _refreshSecurityGroupLimits$: Subject<void> = new Subject();

    get refreshSecurityGroupLimits$(): Subject<void> {
        return this._refreshSecurityGroupLimits$;
    }

    handleSecurityGroupRefresh($event): void {
        this._refreshSecurityGroupLimits$.next();
    }

}
