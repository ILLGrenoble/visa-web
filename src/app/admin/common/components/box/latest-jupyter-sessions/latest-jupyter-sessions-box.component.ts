import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {NotifierService} from 'angular-notifier';
import {Apollo} from 'apollo-angular';
import {ApolloQueryResult} from '@apollo/client';
import {InstanceJupyterSession} from 'app/core/graphql/types';
import gql from 'graphql-tag';
import {Observable, Subject} from 'rxjs';
import {delay, switchMap, takeUntil, tap} from 'rxjs/operators';


@Component({
    selector: 'visa-admin-latest-instance-jupyter-sessions-box',
    templateUrl: './latest-jupyter-sessions-box.component.html',
})
export class LatestJupyterSessionsBoxComponent implements OnInit, OnDestroy {
    private _refresh$: Subject<void>;

    private _data: InstanceJupyterSession[] = [];

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

    get data(): InstanceJupyterSession[] {
        return this._data;
    }

    set data(value: InstanceJupyterSession[]) {
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
                    this.notifierService.notify('error', `There was an error fetching the latest Jupyter sessions`);
                }
                this.data = data.jupyterSessions.data.reduce((reduced, session) => {
                    const existingSession = reduced.find(reducedSession => reducedSession.instance.id === session.instance.id
                                                         && reducedSession.user.id === session.user.id);
                    if (existingSession) {
                        if (existingSession.duration > session.duration) {
                            reduced = reduced.filter(aSession => aSession.id !== existingSession.id);
                            reduced.push(session);
                            reduced.kernelCount = existingSession.kernelCount + 1;
                        } else {
                            existingSession.kernelCount++;
                        }
                    } else {
                        session.kernelCount = 1;
                        reduced.push(session);
                    }
                    return reduced;
                }, []);
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
                 query jupyterSessions($pagination: Pagination!, $filter: QueryFilter, $orderBy: OrderBy) {
                    jupyterSessions(pagination:$pagination, filter: $filter, orderBy: $orderBy) {
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
                            active
                            duration
                            instance {
                                id
                                name
                            }
                            sessionId
                            kernelId
                            user {
                                id
                                fullName
                                firstName
                                lastName
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
