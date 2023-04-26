import {Component, OnDestroy, OnInit} from '@angular/core';
import {BehaviorSubject, Subject} from 'rxjs';
import {Apollo} from "apollo-angular";
import gql from "graphql-tag";
import {map, takeUntil} from 'rxjs/operators';

@Component({
    selector: 'visa-admin-dashboard',
    templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit, OnDestroy {

    private _refreshEvent$: Subject<void> = new BehaviorSubject<void>(null);
    private _destroy$: Subject<boolean> = new Subject<boolean>();

    private _multiCloudEnabled = false;

    constructor(private readonly _apollo: Apollo) {
    }

    get refreshEvent$(): Subject<void> {
        return this._refreshEvent$;
    }

    set refreshEvent$(value: Subject<void>) {
        this._refreshEvent$ = value;
    }

    public handleRefresh(): void {
        this._refreshEvent$.next();
    }

    get multiCloudEnabled(): boolean {
        return this._multiCloudEnabled;
    }

    ngOnInit(): void {
        this._apollo.query<any>({
            query: gql`
                query {
                    cloudClients  {
                        id
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
            this._multiCloudEnabled = cloudClients.length > 1;
        });
    }

    ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }
}
