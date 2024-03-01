import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {NotifierService} from 'angular-notifier';
import {Apollo} from 'apollo-angular';
import {ApolloQueryResult} from '@apollo/client';
import {InstanceSessionMember} from 'app/core/graphql/types';
import gql from 'graphql-tag';
import {Observable, Subject} from 'rxjs';
import {delay, switchMap, takeUntil, tap} from 'rxjs/operators';

@Component({
    selector: 'visa-admin-latest-instance-sessions-box',
    templateUrl: './latest-sessions-box.component.html',
})
export class LatestSessionsBoxComponent implements OnInit, OnDestroy {
    private _refresh$: Subject<void>;

    private _data: InstanceSessionMember[] = [];

    private _destroy$: Subject<boolean> = new Subject<boolean>();

    private _loading = true;

    public get destroy$(): Subject<boolean> {
        return this._destroy$;
    }

    public set destroy$(value: Subject<boolean>) {
        this._destroy$ = value;
    }

    get refresh$(): Subject<void> {
        return this._refresh$;
    }

    @Input('refresh')
    set refresh$(value: Subject<void>) {
        this._refresh$ = value;
    }

    get data(): InstanceSessionMember[] {
        return this._data;
    }

    set data(value: InstanceSessionMember[]) {
        this._data = value;
    }

    get loading(): boolean {
        return this._loading;
    }

    set loading(value: boolean) {
        this._loading = value;
    }

    constructor(private apollo: Apollo,
                private notifierService: NotifierService) {
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
                    this.notifierService.notify('error', `There was an error fetching the latest sessions`);
                }
                this.data = data.sessions.data;
                this.loading = loading;
            });
    }

    public ngOnDestroy(): void {
        this.destroy$.next(true);
        this.destroy$.unsubscribe();
    }

    private fetch(): Observable<ApolloQueryResult<any>> {
        return this.apollo.query<any>({
            query: gql`
                 query allSessions($pagination: Pagination!, $filter: QueryFilter, $orderBy: OrderBy) {
                    sessions(pagination:$pagination, filter: $filter, orderBy: $orderBy) {
                       pageInfo {
                            currentPage
                            totalPages
                            count
                            offset
                            limit
                            hasNextPage
                            hasPrevPage
                        }
                        data {
                            id
                            createdAt
                            role
                            active
                            duration
                            instanceSession {
                                id
                                instance {
                                    id
                                    uid
                                    name
                                }
                                current
                            }
                            user {
                                id
                                fullName
                                firstName
                                lastName
                                affiliation {
                                  name
                                }
                            }
                        }
                    }
                }
            `,
            variables: {
                pagination: {offset: 0, limit: 10},
                filter: {query: 'active = :active', parameters: [{name: 'active', value: 'true'}]},
                orderBy: {name: 'createdAt', ascending: false},
            },
        });
    }
}
