import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {ClrDatagridSortOrder, ClrDatagridStateInterface} from '@clr/angular';
import {Apollo} from 'apollo-angular';
import {Instance, InstanceConnection, InstanceFilterInput} from 'app/core/graphql/types';
import gql from 'graphql-tag';
import {Subject} from 'rxjs';
import {map, takeUntil, tap} from 'rxjs/operators';
import {QueryParameterBag} from '../../http';
import {InstancesFilterState} from './instances-filter-state';
import {Title} from '@angular/platform-browser';
import {InstancesColumnsState} from "./instances-columns-state";

@Component({
    selector: 'visa-admin-instances',
    templateUrl: './instances.component.html',
})
export class InstancesComponent implements OnInit, OnDestroy {

    private _instances: InstanceConnection;

    private _loading = true;

    private _filterState: InstancesFilterState;
    private _columnsState: InstancesColumnsState = { vdiProtocol: false, cloudClient: false, flavour: false, image: false, terminationDate: false}

    private _destroy$: Subject<boolean> = new Subject<boolean>();

    private _state$ = new Subject<InstancesFilterState>();

    private _multiCloudEnabled = false;

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

    public get filterState(): InstancesFilterState {
        return this._filterState;
    }

    public set filterState(value: InstancesFilterState) {
        this._filterState = value;
    }

    get columnsState(): InstancesColumnsState {
        return this._columnsState;
    }

    public get loading(): boolean {
        return this._loading;
    }

    public set loading(value) {
        this._loading = value;
    }

    get multiCloudEnabled(): boolean {
        return this._multiCloudEnabled;
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
            this.filterState = state;
            this.reload();
        });

        this.route.queryParams.pipe(
            takeUntil(this.destroy$),
            map((params) => new QueryParameterBag(params)),
        ).subscribe((params: QueryParameterBag) => {
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
                page: params.getNumber('page', 1),
                descending: params.getBoolean('descending', true),
                orderBy: params.getString('orderBy', 'id'),
            };
            this.state$.next(state);
        });
    }

    public handleRefresh(): void {
        this.reload();
    }

    public reload(): void {
        const filters = this.processFilters();
        const state = this.filterState;
        this.loading = true;
        this.apollo.query<any>({
            query: gql`
                      query allInstances($filter: InstanceFilterInput, $orderBy: OrderBy, $pagination: Pagination!) {
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
                                vdiProtocol
                                terminationDate
                                lastSeenAt
                                lastInteractionAt
                                ipAddress
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
                               }
                               cloudClient {
                                    id
                                    name
                               }
                            }
                        }
                        cloudClients {
                          id
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
                map(({data}) => ({instances: data.instances, cloudClients: data.cloudClients})),
                tap(() => this.loading = false),
            )
            .subscribe(({instances, cloudClients}) => {
                this.instances = instances;
                this._multiCloudEnabled = cloudClients.length > 1;
                this.updateUrl();
            });
    }

    public ngOnDestroy(): void {
        this.destroy$.next(true);
        this.destroy$.unsubscribe();
    }

    public onGridChange(data: ClrDatagridStateInterface): void {
        this.state$.next({
            ...this.filterState,
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
        const currentState = this.filterState;
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

    private updateUrl(): void {
        const currentState = this.filterState;
        this.router.navigate([],
            {
                relativeTo: this.route,
                queryParams: {
                    ...this.filterState.filters,
                    page: currentState.page === 1 ? null : currentState.page,
                    orderBy: currentState.orderBy === 'id' ? null : currentState.orderBy,
                    descending: currentState.descending === true ? null : currentState.descending,
                },
                queryParamsHandling: 'merge',
                replaceUrl: true,
            },
        );
    }

    private processFilters(): InstanceFilterInput {
        const {name, id, flavour, image, instrument, state, user} = this.filterState.filters;
        return {
            ids: id ? [id] : null,
            nameLike: name,
            instrumentId: instrument,
            imageId: image,
            flavourId: flavour,
            state,
            ownerId: user,
        }
    }

    public formatImageName(image): void {
        return image.version ? `${image.name} (${image.version})` : image.name;
    }

}
