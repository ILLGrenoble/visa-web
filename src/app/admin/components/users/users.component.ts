import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {ClrDatagridSortOrder, ClrDatagridStateInterface} from '@clr/angular';
import {Apollo} from 'apollo-angular';
import {UserConnection, UserFilterInput} from 'app/core/graphql/types';
import gql from 'graphql-tag';
import {Observable, Subject} from 'rxjs';
import {filter, map, take, takeUntil, tap} from 'rxjs/operators';
import {QueryParameterBag} from '../../http';
import {UsersFilterState} from './users-filter-state';
import {Store} from '@ngrx/store';
import {ApplicationState, selectLoggedInUser, User as CoreUser} from '../../../core';
import {User} from '../../../core/graphql';
import {NotifierService} from 'angular-notifier';
import {UsersFilterComponent} from "./users-filter.component";

@Component({
    selector: 'visa-admin-users',
    styleUrls: ['./users.component.scss'],
    templateUrl: './users.component.html',
})
export class UsersComponent implements OnInit, OnDestroy {

    @ViewChild(UsersFilterComponent) filter: UsersFilterComponent;

    private _user$: Observable<CoreUser>;

    private _users: UserConnection;

    private _loading = true;

    private _currentState: UsersFilterState;

    private _destroy$: Subject<boolean> = new Subject<boolean>();

    private _state$ = new Subject<UsersFilterState>();

    public get destroy$(): Subject<boolean> {
        return this._destroy$;
    }

    get user$(): Observable<CoreUser> {
        return this._user$;
    }

    get users(): UserConnection {
        return this._users;
    }
    set users(value: UserConnection) {
        this._users = value;
    }

    public get state$(): Subject<UsersFilterState> {
        return this._state$;
    }

    public get currentState(): UsersFilterState {
        return this._currentState;
    }

    public set currentState(value: UsersFilterState) {
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
        private store: Store<ApplicationState>,
        private notifierService: NotifierService) {
        this._user$ = store.select(selectLoggedInUser).pipe(filter(user => !!user), take(1));
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
                filters: {
                    userId: params.getString('userId', null),
                    activated: params.getBoolean('activated', true),
                    role:  params.getString('role', null),
                },
                page: params.getNumber('page', 1),
                descending: params.getBoolean('descending', false),
                orderBy: params.getString('orderBy', 'activatedAt'),
            };
            this.state$.next(state);
        });
    }

    public reload(): void {
        const filters = this.processFilters();
        const state = this.currentState;
        this.loading = true;
        this.apollo.query<any>({
            query: gql`
                      query allUsers($filter: UserFilterInput, $orderBy: OrderBy, $pagination: Pagination!) {
                        users(filter: $filter, pagination: $pagination, orderBy: $orderBy) {
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
                                firstName
                                lastName
                                fullName
                                email
                                affiliation {
                                    id
                                    name
                                    town
                                    countryCode
                                }
                                activeUserRoles {
                                    role {
                                        name
                                    }
                                    expiresAt
                                }
                                groups {
                                    name
                                }
                                lastSeenAt
                                activatedAt
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
                map(({data}) => data.users),
                tap(() => this.loading = false),
            )
            .subscribe((data) => {
                this.users = data;
                this.users.data.forEach((user: any) => {
                    user.isAdmin = this.userHasRole(user, 'ADMIN');
                    user.isGuest = this.userHasRole(user, 'GUEST');
                });
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

    public onFilter(state: UsersFilterState): void {
        this.state$.next(state);
    }

    public onGroupsChanged(): void {
        this.reload();
        this.filter.reload();
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

    public userHasRole(user: User, roleName: string): boolean {
        return user.activeUserRoles.find(userRole => userRole.role.name === roleName) != null;
    }

    public userIsSupport(user: User): boolean {
        return ['IT_SUPPORT', 'INSTRUMENT_CONTROL', 'INSTRUMENT_SCIENTIST'].some(supportRole => {
            return user.activeUserRoles.map(userRole => userRole.role.name).includes(supportRole);
        });
    }

    public toggleRole(user: any, roleName: string): void {
        this.apollo.mutate({
            mutation: gql`
              mutation updateUserRole($userId: String!, $roleName: String!, $isEnabled: Boolean!) {
                updateUserRole(userId: $userId, roleName: $roleName, isEnabled: $isEnabled) {
                    id
                    firstName
                    lastName
                    fullName
                    email
                    affiliation {
                        id
                        name
                        town
                        countryCode
                    }
                    activeUserRoles {
                        role {
                            name
                        }
                        expiresAt
                    }
                    lastSeenAt
                    activatedAt
                }
              }
            `,
            variables: {
                userId: user.id,
                roleName,
                isEnabled: !this.userHasRole(user, roleName)
            },
        }).subscribe((result: any) => {
            const returnedUser = result.data.updateUserRole;
            user.activeUserRoles = returnedUser.activeUserRoles;
            user.isAdmin = this.userHasRole(user, 'ADMIN');
            user.isGuest = this.userHasRole(user, 'GUEST');
            this.notifierService.notify('success', 'Updated user roles successfully');
        });
    }

    private updateUrl(): void {
        const currentState = this.currentState;
        this.router.navigate([],
            {
                relativeTo: this.route,
                queryParams: {
                    ...this.currentState.filters,
                    page: currentState.page === 1 ? null : currentState.page,
                    orderBy: currentState.orderBy === 'activatedAt' ? null : currentState.orderBy,
                    descending: currentState.descending === false ? null : currentState.descending,
                },
                queryParamsHandling: 'merge',
                replaceUrl: true,
            },
        );
    }

    private processFilters(): UserFilterInput {
        return {
            id: this.currentState.filters.userId,
            role: this.currentState.filters.role,
            activated: this.currentState.filters.activated ? true : null,
        }
    }

}
