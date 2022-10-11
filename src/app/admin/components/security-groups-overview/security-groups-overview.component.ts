import {Component, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {Subject} from 'rxjs';
import {Apollo} from 'apollo-angular';
import {delay, map, startWith, switchMap, takeUntil, tap} from 'rxjs/operators';
import gql from 'graphql-tag';
import {CloudClient} from '../../../core/graphql';
import {FormControl, FormGroup, Validators} from '@angular/forms';

@Component({
    selector: 'visa-admin-security-groups-overview',
    templateUrl: './security-groups-overview.component.html',
    encapsulation: ViewEncapsulation.None,
    styleUrls: ['./security-groups-overview.component.scss']
})

export class SecurityGroupsOverviewComponent implements OnInit, OnDestroy {

    private _cloudClients: CloudClient[];
    private _refreshSecurityGroupLimits$: Subject<void> = new Subject();
    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _selectedCloudClient: CloudClient;
    private _multiCloudEnabled = false;

    constructor(private readonly _apollo: Apollo) {
    }


    get selectedCloudClient(): CloudClient {
        return this._selectedCloudClient;
    }

    set selectedCloudClient(value: CloudClient) {
        this._selectedCloudClient = value;
    }

    get refreshSecurityGroupLimits$(): Subject<void> {
        return this._refreshSecurityGroupLimits$;
    }

    get cloudClients(): CloudClient[] {
        return this._cloudClients;
    }

    get multiCloudEnabled(): boolean {
        return this._multiCloudEnabled;
    }

    public ngOnInit(): void {
        this._apollo.query<any>({
            query: gql`
                query {
                    cloudClients {
                        id
                        name
                    }
                }
            `
        }).pipe(
            map(({data}) => ({
                cloudClients: data.cloudClients,
                })
            ),
            takeUntil(this._destroy$)
        ).subscribe(({cloudClients}) => {
            this._cloudClients = cloudClients;
            this._selectedCloudClient = this._cloudClients[0];
            this._multiCloudEnabled = cloudClients.length > 1;
        });
    }

    public ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    handleSecurityGroupRefresh($event): void {
        this._refreshSecurityGroupLimits$.next();
    }

    onCloudChange(): void {

    }
}
