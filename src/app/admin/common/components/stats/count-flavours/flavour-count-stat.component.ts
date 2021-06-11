import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {NotifierService} from 'angular-notifier';
import {Apollo} from 'apollo-angular';
import {ApolloQueryResult} from 'apollo-client';
import gql from 'graphql-tag';
import {Observable, Subject} from 'rxjs';
import {delay, switchMap, takeUntil, tap} from 'rxjs/operators';

@Component({
    selector: 'visa-admin-flavour-count-stat',
    templateUrl: './flavour-count-stat.component.html',
})
export class FlavourCountStatComponent implements OnInit, OnDestroy {

    private _refresh$: Subject<void>;

    private _destroy$: Subject<boolean> = new Subject<boolean>();

    private _data: number;

    private _loading = true;

    get loading(): boolean {
        return this._loading;
    }

    set loading(value: boolean) {
        this._loading = value;
    }

    get data(): number {
        return this._data;
    }

    set data(value: number) {
        this._data = value;
    }

    get refresh$(): Subject<void> {
        return this._refresh$;
    }

    @Input('refresh')
    set refresh$(value: Subject<void>) {
        this._refresh$ = value;
    }

    get destroy$(): Subject<boolean> {
        return this._destroy$;
    }

    set destroy$(value: Subject<boolean>) {
        this._destroy$ = value;
    }

    constructor(private apollo: Apollo, private notifierService: NotifierService) {
    }

    public ngOnInit(): void {
        this.refresh$
            .pipe(
                takeUntil(this.destroy$),
                tap(() => this.loading = true),
                delay(1000),
                switchMap(() => this.fetch()),
            )
            .subscribe(({data, loading, errors}) => {
                if (errors) {
                    this.notifierService.notify('error', `There was an error fetching the flavour count`);
                } else {
                    this.data = data.countFlavours;
                }
                this.loading = loading;
            });
    }

    public ngOnDestroy(): void {
        this.destroy$.next(true);
        this.destroy$.unsubscribe();
    }

    private fetch(): Observable<ApolloQueryResult<any>> {
        return this.apollo
            .query<any>({
                query: gql`
              {
                countFlavours
              }
            `,
            });
    }

}
