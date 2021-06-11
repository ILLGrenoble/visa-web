import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {NotifierService} from 'angular-notifier';
import {Apollo} from 'apollo-angular';
import {ApolloQueryResult} from 'apollo-client';
import {GraphQLError} from 'graphql';
import gql from 'graphql-tag';
import {Observable, Subject} from 'rxjs';
import {delay, switchMap, takeUntil, tap} from 'rxjs/operators';

@Component({
    selector: 'visa-admin-image-count-stat',
    templateUrl: './image-count-stat.component.html',
})
export class ImageCountStatComponent implements OnInit, OnDestroy {

    private _refresh$: Subject<void>;

    private _destroy$: Subject<boolean> = new Subject<boolean>();

    private _data: number;

    private _loading = true;

    private _error: ReadonlyArray<GraphQLError>;

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

    get error(): ReadonlyArray<GraphQLError> {
        return this._error;
    }

    set error(value: ReadonlyArray<GraphQLError>) {
        this._error = value;
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
                    this.notifierService.notify('error', `There was an error fetching the image count`);
                } else {
                    this.data = data.countImages;
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
                countImages
              }
            `,
            });
    }

}
