import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {ClrDatagridStateInterface} from '@clr/angular';
import {Apollo} from 'apollo-angular';
import gql from 'graphql-tag';
import {Subject} from 'rxjs';
import {map, takeUntil, tap} from 'rxjs/operators';
import {QueryParameterBag} from '../../http';
import {ExperimentConnection} from '../../../core/graphql';
import {UserExperimentsFilterState} from './user-experiments-filter-state';
import {FilterAttribute, FilterProvider} from '../../services';

@Component({
    selector: 'visa-admin-user-experiments',
    templateUrl: './user-experiments.component.html',
})
export class UserExperimentsComponent implements OnInit, OnDestroy {

    private _userId: string;

    private _experiments: ExperimentConnection;

    private _loading = true;

    private _destroy$: Subject<boolean> = new Subject<boolean>();

    private _currentState: UserExperimentsFilterState;

    private _state$ = new Subject<UserExperimentsFilterState>();

    public get destroy$(): Subject<boolean> {
        return this._destroy$;
    }

    get experiments(): ExperimentConnection {
        return this._experiments;
    }

    set experiments(value: ExperimentConnection) {
        this._experiments = value;
    }

    public get loading(): boolean {
        return this._loading;
    }

    public set loading(value) {
        this._loading = value;
    }

    public get state$(): Subject<UserExperimentsFilterState> {
        return this._state$;
    }

    public get currentState(): UserExperimentsFilterState {
        return this._currentState;
    }

    public set currentState(value: UserExperimentsFilterState) {
        this._currentState = value;
    }

    get userId(): string {
        return this._userId;
    }

    @Input('userId')
    set userId(value: string) {
        this._userId = value;
    }

    constructor(
        private apollo: Apollo,
        private router: Router,
        private route: ActivatedRoute) {
    }

    public ngOnInit(): void {
        this.state$.pipe(
            takeUntil(this.destroy$),
        ).subscribe((state) => {
            this.currentState = state;
            this.reload();
        });

        this.route.queryParams.pipe(
            takeUntil(this.destroy$),
            map((params) => new QueryParameterBag(params)),
        ).subscribe((params: QueryParameterBag) => {
            const state = {
                page: params.getNumber('page', 1),
                query: null
            };
            this.state$.next(state);
        });
    }

    public reload(): void {
        const state = this.currentState;
        const filters = this.processFilters();
        this.loading = true;
        this.apollo.query<any>({
            query: gql`
                      query allExperiments($filter: QueryFilter, $orderBy: OrderBy, $pagination: Pagination!) {
                        experiments(filter: $filter, pagination: $pagination, orderBy: $orderBy) {
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
                                proposal {
                                    identifier
                                    title
                                }
                                instrument {
                                    name
                                }
                                startDate
                            }
                        }
                    }
                  `,
            variables: {
                filter: filters,
                pagination: {
                    limit: 25,
                    offset: (state.page - 1) * 25,
                },
                orderBy: {
                    name: 'startDate', ascending: true
                },
            },
        })
            .pipe(
                takeUntil(this.destroy$),
                map(({data}) => data.experiments),
                tap(() => this.loading = false),
            )
            .subscribe((data) => {
                this.experiments = data;
            });
    }

    public ngOnDestroy(): void {
        this.destroy$.next(true);
        this.destroy$.unsubscribe();
    }

    private processFilters(): any {
        const provider = this._createFilter();
        const query = provider.createQuery();
        if (this._currentState.query) {
            query.setParameter('proposal', this._currentState.query);
        }
        query.setParameter('user', this._userId);
        return query.execute();
    }

    private _createFilter(): FilterProvider {
        return new FilterProvider({
            proposal: new FilterAttribute('proposal.identifier', 'proposal', 'LIKE'),
            user: new FilterAttribute('users.id', 'user', '='),
        });
    }

    public onGridChange(data: ClrDatagridStateInterface): void {
        this.state$.next({
            ...this.currentState,
            page: data.page ? Math.floor(data.page.from / 25) + 1 : 1,
            query: data.filters ? data.filters[0].value : null,
        });
    }
}
