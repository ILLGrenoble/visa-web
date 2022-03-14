import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {NotifierService} from 'angular-notifier';
import {Apollo} from 'apollo-angular';
import {Instance, InstanceSessionMember} from 'app/core/graphql/types';
import gql from 'graphql-tag';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {delay, switchMap, takeUntil, tap} from 'rxjs/operators';
import {environment} from '../../../../environments/environment';
import screenfull from 'screenfull';
import {ApolloQueryResult} from '@apollo/client';

@Component({
    selector: 'visa-admin-sessions',
    styleUrls: ['./sessions.component.scss'],
    templateUrl: './sessions.component.html',
})
export class SessionsComponent implements OnInit, OnDestroy {

    private static SELECTED_TAB_KEY = 'admin.sessions.selectedTab';

    public sessions: InstanceSessionMember[] = [];
    public loading: boolean;
    private _refreshEvent$: Subject<void> = new BehaviorSubject<void>(null);
    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _gridContainer: ElementRef;
    private _selectedTab: string;

    get refreshEvent$(): Subject<void> {
        return this._refreshEvent$;
    }

    set refreshEvent$(value: Subject<void>) {
        this._refreshEvent$ = value;
    }

    get destroy$(): Subject<boolean> {
        return this._destroy$;
    }

    set destroy$(value: Subject<boolean>) {
        this._destroy$ = value;
    }

    get selectedTab(): string {
        return this._selectedTab;
    }

    set selectedTab(value) {
        this._selectedTab = value;
        if (value != null) {
            localStorage.setItem(SessionsComponent.SELECTED_TAB_KEY, value);
        }
    }

    get gridContainer(): ElementRef {
        return this._gridContainer;
    }

    @ViewChild('gridContainer')
    set gridContainer(value: ElementRef) {
        this._gridContainer = value;
    }

    constructor(private apollo: Apollo, private notifierService: NotifierService) {
    }

    public handleRefresh($event: void): void {
        this.refreshEvent$.next();
    }

    public ngOnInit(): void {
        const selectedTab = localStorage.getItem(SessionsComponent.SELECTED_TAB_KEY);
        this._selectedTab = selectedTab;

        this.refreshEvent$
            .pipe(
                takeUntil(this.destroy$),
                tap(() => this.loading = true),
                delay(1000),
                switchMap(() => this.fetch()),
            )
            .subscribe(({data, loading, errors}) => {
                if (errors) {
                    this.notifierService.notify('error', `There was an error loading the sessions`);
                }
                this.sessions = data.sessions.data;
                this.loading = loading;
            });
    }

    public ngOnDestroy(): void {
        this.destroy$.next(true);
        this.destroy$.unsubscribe();
    }

    public isInteractiveSession(instanceSessionMember: InstanceSessionMember): boolean {
        const timeSinceLastInteractionAtS = (new Date().getTime() - new Date(instanceSessionMember.lastInteractionAt).getTime()) / 1000;
        return timeSinceLastInteractionAtS < 300;
    }

    public getThumbnailUrlForInstance(instance: Instance): string {
        const baseUrl = environment.paths.api;
        return `${baseUrl}/instances/${instance.uid}/thumbnail`;
    }

    /**
     * Enter full screen mode and auto hide the toolbar
     */
    public enterFullScreen(): void {
        if (screenfull.isFullscreen) {
            return;
        }
        const containerElement = this._gridContainer.nativeElement;
        screenfull.request(containerElement);
    }

    public isFullScreen(): boolean {
        return screenfull.isFullscreen;
    }

    private fetch(): Observable<ApolloQueryResult<any>> {
        return this.apollo
            .query<any>({
                query: gql`
                query allSessions($pagination: Pagination!, $filter: QueryFilter, $orderBy: OrderBy) {
                    sessions(pagination:$pagination,filter:$filter,orderBy:$orderBy) {
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
                            lastInteractionAt
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
                            sessionId
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
                    pagination: {offset: 0},
                    filter: {
                        query: 'active = :active',
                        parameters: [{
                            name: 'active', value: 'true',
                        }],
                    },
                    orderBy: {name: 'createdAt', ascending: false},
                },
            });
    }

}
