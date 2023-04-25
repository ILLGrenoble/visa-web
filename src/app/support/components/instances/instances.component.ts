import {Component, OnDestroy, OnInit} from '@angular/core';
import {ClrDatagridSortOrder, ClrDatagridStateInterface} from '@clr/angular';
import {ActivatedRoute, Router, } from '@angular/router';
import {Observable, Subject, Subscription, timer} from 'rxjs';
import {filter, map, takeUntil} from 'rxjs/operators';
import {QueryParameterBag} from './query-parameter-bag';
import {
    AccountService,
    AnalyticsService,
    ApplicationState,
    Instance,
    InstanceSessionMember,
    InstancesFilterState,
    Paginated,
    selectLoggedInUser,
    User
} from '@core';
import {Title} from '@angular/platform-browser';
import {Store} from '@ngrx/store';

@Component({
    selector: 'visa-support-instances',
    templateUrl: './instances.component.html',
    styleUrls: ['./instances.component.scss']
})
export class InstancesComponent implements OnInit, OnDestroy {

    private _user$: Observable<User>;

    private _user: User;

    private _instances: Paginated<Instance[]>;

    private _loading = true;

    private _currentState: InstancesFilterState;

    private _destroy$: Subject<boolean> = new Subject<boolean>();

    private _state$ = new Subject<InstancesFilterState>();

    private _sessions: Map<number, InstanceSessionMember[]> = new Map();

    private refreshTimer$: Subscription;
    private refreshTimeMS = 60000;

    public get destroy$(): Subject<boolean> {
        return this._destroy$;
    }

    public set destroy$(value: Subject<boolean>) {
        this._destroy$ = value;
    }

    get instances(): Paginated<Instance[]> {
        return this._instances;
    }

    set instances(value: Paginated<Instance[]>) {
        this._instances = value;
    }

    public get state$(): Subject<InstancesFilterState> {
        return this._state$;
    }

    public set state$(value) {
        this._state$ = value;
    }

    public get currentState(): InstancesFilterState {
        return this._currentState;
    }

    public set currentState(value: InstancesFilterState) {
        this._currentState = value;
    }

    public get loading(): boolean{
        return this._loading;
    }

    public set loading(value: boolean) {
        this._loading = value;
    }

    get user(): User {
        return this._user;
    }

    set user(value: User) {
        this._user = value;
    }


    get user$(): Observable<User> {
        return this._user$;
    }

    set user$(value: Observable<User>) {
        this._user$ = value;
    }

    constructor(
        private accountService: AccountService,
        private titleService: Title,
        private router: Router,
        private route: ActivatedRoute,
        private analyticsService: AnalyticsService,
        private store: Store<ApplicationState>) {
    }

    public ngOnInit(): void {
        const title = `Support | VISA`;
        this.titleService.setTitle(title);
        this.analyticsService.trackPageView(title);
        this.user$ = this.store.select(selectLoggedInUser);

        this.state$.pipe(
            takeUntil(this.destroy$),
        ).subscribe((state) => {
            this.currentState = state;
            this.reload();
        });

        this.route.queryParams.pipe(
            takeUntil(this.destroy$),
            map((params) => new QueryParameterBag(params))
        ).subscribe((params: QueryParameterBag) => {
            const state = {
                filters: {
                    name: params.getString('name', null),
                    id: params.getNumber('id', null),
                    owner: params.getNumber('owner', null),
                    instrument: params.getNumber('instrument', null)
                },
                page: params.getNumber('page', 1),
                limit: params.getNumber('limit', 25),
                descending: params.getBoolean('descending', true),
                orderBy: params.getString('orderBy', 'id')
            };
            this.state$.next(state);
        });

        this._user$.pipe(filter(user => user != null)).subscribe(user => {
            this._user = user;
        });

        const observable = timer(0, this.refreshTimeMS);
        this.refreshTimer$ = observable.subscribe(() => this.reload(true));
    }

    public ngOnDestroy(): void {
        this.destroy$.next(true);
        this.destroy$.unsubscribe();
        this.refreshTimer$.unsubscribe();
    }

    public onGridChange(data: ClrDatagridStateInterface): void {
        this.state$.next({
            ...this.currentState,
            page: data.page ? Math.floor(data.page.from / this.currentState.limit) + 1 : 1,
            descending: data.sort.reverse,
            orderBy: data.sort.by.toString(),
        });
    }

    public onFilter(state: InstancesFilterState): void {
        this.state$.next(state);
    }

    public reload(discrete: boolean = false): void {
        if (!discrete) {
            this.loading = true;
        }
        this.accountService.getInstancesForSupport(this.currentState).subscribe(instances => {
            this.loading = false;
            this.instances = instances;

            const newSessions = new Map();
            instances.items.forEach(instance => {
                const timeSinceLastSeenAtS = (new Date().getTime() - new Date(instance.lastSeenAt).getTime()) / 1000;
                if (timeSinceLastSeenAtS < 120) {
                    this.accountService.getSessionMembersForInstance(instance).subscribe(sessionMembers => {
                        newSessions.set(instance.id, sessionMembers);
                    });
                }
            });
            this._sessions = newSessions;
            this.updateUrl();
        });
    }

    /**
     * Check if the column should be sorted or not
     * @param column the column to check
     */
    public isColumnSorted(column: string): ClrDatagridSortOrder {
        const currentState = this.currentState;
        if (column === currentState.orderBy) {
            if (currentState.descending) {
                return ClrDatagridSortOrder.DESC;
            } else {
                return ClrDatagridSortOrder.ASC;
            }
        }
        return ClrDatagridSortOrder.UNSORTED;
    }

    public getInstanceInstruments(instance: Instance): string {
        const instruments = instance.experiments
            .map(experiment => experiment.instrument.name)
            .filter((value, index, array) => array.indexOf(value) === index);

        return instruments.join(', ');
    }

    public getInstanceSessionMembers(instance: Instance): InstanceSessionMember[] {
        const members: InstanceSessionMember[] = this._sessions.get(instance.id);
        if (members == null) {
            return [];
        }
        return members;
    }

    public isInteractiveSession(instance: Instance): boolean {
        const timeSinceLastInteractionAtS = (new Date().getTime() - new Date(instance.lastInteractionAt).getTime()) / 1000;
        return timeSinceLastInteractionAtS < 300;
    }

    public canConnect(instance: Instance): boolean {
        if (instance.state !== 'ACTIVE' && instance.state !== 'PARTIALLY_ACTIVE') {
            return false;
        }
        if (this._user != null && (this._user.id === instance.owner.id)) {
            return true;
        }

        const sessionMembers = this.getInstanceSessionMembers(instance);
        if (sessionMembers.length > 0) {
            // Check if owner connected
            if (sessionMembers.map(sessionMember => sessionMember.role).includes('OWNER')) {
                return true;
            }
        }

        return instance.canConnectWhileOwnerAway;
    }

    private updateUrl(): void {
        const currentState = this.currentState;
        this.router.navigate([],
            {
                relativeTo: this.route,
                queryParams: {
                    ...this.currentState.filters,
                    page: currentState.page === 1 ? null : currentState.page,
                    limit: currentState.limit === 25 ? null : currentState.limit,
                    orderBy: currentState.orderBy === 'id' ? null : currentState.orderBy,
                    descending: currentState.descending === true ? null : currentState.descending
                },
                queryParamsHandling: 'merge',
                replaceUrl: true
            }
        );
    }


}
