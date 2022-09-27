import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {ClrDatagridSortOrder, ClrDatagridStateInterface} from '@clr/angular';
import {Apollo} from 'apollo-angular';
import {Instance, InstanceConnection} from 'app/core/graphql/types';
import gql from 'graphql-tag';
import {Subject} from 'rxjs';
import {map, takeUntil, tap} from 'rxjs/operators';
import {QueryParameterBag} from '../../http';
import {FilterAttribute, FilterProvider} from '../../services';
import {InstancesFilterState} from './instances-filter-state';
import {Title} from '@angular/platform-browser';

@Component({
    selector: 'visa-admin-instances',
    templateUrl: './instances.component.html',
})
export class InstancesComponent implements OnInit, OnDestroy {

    private _instances: InstanceConnection;

    private _loading = true;

    private _currentState: InstancesFilterState;

    private _destroy$: Subject<boolean> = new Subject<boolean>();

    private _state$ = new Subject<InstancesFilterState>();

    public get destroy$(): Subject<boolean> {
        return this._destroy$;
    }

    public get instances(): InstanceConnection {
        return this._instances;
    }

    public set instances(value: InstanceConnection) {
        this._instances = value;
    }

    public get state$(): Subject<InstancesFilterState> {
        return this._state$;
    }

    public get currentState(): InstancesFilterState {
        return this._currentState;
    }

    public set currentState(value: InstancesFilterState) {
        this._currentState = value;
    }

    public get loading(): boolean {
        return this._loading;
    }

    public set loading(value) {
        this._loading = value;
    }

    constructor(
        private apollo: Apollo,
        private router: Router,
        private route: ActivatedRoute,
        private titleService: Title) {
    }

    public ngOnInit(): void {
        this.titleService.setTitle(`Instances | Compute | Admin | VISA`);

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
            const columns = params.getList('columns', []);
            const state = {
                filters: {
                    name: params.getString('name', null),
                    id: params.getNumber('id', null),
                    image: params.getNumber('image', null),
                    flavour: params.getNumber('flavour', null),
                    instrument: params.getNumber('instrument', null),
                    state: params.getString('state', null),
                    user: params.getString('user', null),
                },
                columns: {
                    image: columns.includes('image'),
                    flavour: columns.includes('flavour'),
                    terminationDate: columns.includes('terminationDate'),
                },
                page: params.getNumber('page', 1),
                descending: params.getBoolean('descending', true),
                orderBy: params.getString('orderBy', 'id'),
            };
            this.state$.next(state);
        });
    }

    public handleRefresh($event: void): void {
        this.reload();
    }

    public reload(): void {
        const filters = this.processFilters();
        const state = this.currentState;
        this.loading = true;
        this.apollo.query<any>({
            query: gql`
                      query allInstances($filter: QueryFilter, $orderBy: OrderBy, $pagination: Pagination!) {
                        instances(filter: $filter, pagination: $pagination, orderBy: $orderBy) {
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
                                uid
                                name
                                state
                                terminationDate
                                lastSeenAt
                                lastInteractionAt
                                owner {
                                    fullName
                                    affiliation {
                                      name
                                    }
                                }
                                createdAt
                                plan {
                                    image {
                                        name
                                        version
                                    }
                                    flavour {
                                        name
                                    }
                                }
                                activeSessions {
                                    id
                                    user {
                                      id
                                      firstName
                                      lastName
                                      fullName
                                    }
                                    createdAt
                                    role
                                    duration
                                    instanceSession {
                                      connectionId
                                       instance {
                                         id
                                         uid
                                         name
                                       }
                                    }
                               }
                               cloudClient {
                                    id
                                    name
                               }
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
                    name: state.orderBy, ascending: !state.descending,
                },
            },
        })
            .pipe(
                takeUntil(this.destroy$),
                map(({data}) => data.instances),
                tap(() => this.loading = false),
            )
            .subscribe((data) => {
                this.instances = data;
                this.updateUrl();
            });
    }

    public ngOnDestroy(): void {
        this.destroy$.next(true);
        this.destroy$.unsubscribe();
    }

    public onGridChange(data: ClrDatagridStateInterface): void {
        this.state$.next({
            ...this.currentState,
            page: data.page ? Math.floor(data.page.from / 25) + 1 : 1,
            descending: !data.sort.reverse,
            orderBy: data.sort.by.toString(),
        });
    }

    public onFilter(state: InstancesFilterState): void {
        this.state$.next(state);
    }

    /**
     * Check if the column should be sorted or not
     * @param column the column to check
     */
    public isColumnSorted(column: string): ClrDatagridSortOrder {
        const currentState = this.currentState;
        if (column === currentState.orderBy) {
            if (currentState.descending) {
                return ClrDatagridSortOrder.ASC;
            } else {
                return ClrDatagridSortOrder.DESC;
            }
        }
        return ClrDatagridSortOrder.UNSORTED;
    }

    public isInteractiveSession(instance: Instance): boolean {
        const timeSinceLastInteractionAtS = (new Date().getTime() - new Date(instance.lastInteractionAt).getTime()) / 1000;
        return timeSinceLastInteractionAtS < 300;
    }

    private createFilter(): FilterProvider {
        return new FilterProvider({
            id: new FilterAttribute('id', 'id', '='),
            name: new FilterAttribute('name', 'name', 'LIKE'),
            instrument: new FilterAttribute('instrument.id', 'instrumentId', '='),
            image: new FilterAttribute('plan.image.id', 'imageId', '='),
            flavour: new FilterAttribute('plan.flavour.id', 'flavourId', '='),
            state: new FilterAttribute('state', 'state', '='),
            user: new FilterAttribute('user.id', 'state', '='),
        });
    }

    private updateUrl(): void {
        const currentState = this.currentState;
        this.router.navigate([],
            {
                relativeTo: this.route,
                queryParams: {
                    ...this.currentState.filters,
                    columns: (() => {
                        const {columns} = this.currentState;
                        const mapped = Object
                            .entries(columns)
                            .filter(([key, value]) => value)
                            .map(([key, value]) => key)
                            .join(',');
                        return mapped || null;
                    })(),
                    page: currentState.page === 1 ? null : currentState.page,
                    orderBy: currentState.orderBy === 'id' ? null : currentState.orderBy,
                    descending: currentState.descending === true ? null : currentState.descending,
                },
                queryParamsHandling: 'merge',
                replaceUrl: true,
            },
        );
    }

    private processFilters(): any {
        const provider = this.createFilter();
        const query = provider.createQuery();
        Object.entries(this.currentState.filters).map(([key, value]) => {
            if (value) {
                query.setParameter(key, value);
            }
        });
        return query.execute();
    }

    public formatImageName(image): void {
        return image.version ? `${image.name} (${image.version})` : image.name;
    }

}
