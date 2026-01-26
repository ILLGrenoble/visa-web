import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Apollo} from 'apollo-angular';
import gql from 'graphql-tag';
import {delay, map, startWith, switchMap, takeUntil, tap} from 'rxjs/operators';
import {BehaviorSubject, Subject} from 'rxjs';
import {CloudClient, SecurityGroupFilter} from '../../../core/graphql';
import {NotifierService} from 'angular-notifier';

@Component({
    selector: 'visa-admin-security-group-filters',
    templateUrl: './security-group-filters.component.html',
})
export class SecurityGroupFiltersComponent implements OnInit, OnDestroy {

    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _refresh$: Subject<void> = new Subject();
    private _cloudClient$: BehaviorSubject<CloudClient> = new BehaviorSubject<CloudClient>(null);

    private _loading: boolean;
    private _multiCloudEnabled: boolean;
    private _securityGroupFilters: SecurityGroupFilter[] = [];
    private _filteredSecurityGroupFilters: SecurityGroupFilter[] = [];
    private _apollo: Apollo;
    private _notifierService: NotifierService;

    private _modalData$ = new Subject<{ objectType: string, cloudClient: CloudClient, multiCloudEnabled: boolean }>();
    private _filterToDelete: SecurityGroupFilter;

    get filteredSecurityGroupFilters(): SecurityGroupFilter[] {
        return this._filteredSecurityGroupFilters;
    }

    get securityGroupFilters(): SecurityGroupFilter[] {
        return this._securityGroupFilters;
    }

    set securityGroupFilters(value: SecurityGroupFilter[]) {
        this._securityGroupFilters = value;
    }

    get loading(): boolean {
        return this._loading;
    }

    set loading(value: boolean) {
        this._loading = value;
    }


    get refresh$(): Subject<void> {
        return this._refresh$;
    }

    @Input('refresh')
    set refresh$(value: Subject<void>) {
        this._refresh$ = value;
    }

    @Input('cloudClient')
    set cloudClient(cloudClient: CloudClient) {
        this._cloudClient$.next(cloudClient);
    }

    @Input('multiCloudEnabled')
    set multiCloudEnabled(multiCloudEnabled: boolean) {
        this._multiCloudEnabled = multiCloudEnabled;
    }

    get modalData$(): Subject<{ objectType: string; cloudClient: CloudClient; multiCloudEnabled: boolean }> {
        return this._modalData$;
    }

    get showDeleteModal(): boolean {
        return this._filterToDelete != null;
    }

    constructor(apollo: Apollo,
                notifierService: NotifierService) {
        this._apollo = apollo;
        this._notifierService = notifierService;
    }

    public ngOnInit(): void {
        this._refresh$
            .pipe(
                startWith(0),
                takeUntil(this._destroy$),
                tap(() => this._loading = true),
                delay(500),
                switchMap(() => this._apollo.query<any>({
                    query: gql`
                      query {
                          securityGroupFilters {
                            id
                            securityGroup {
                              id
                              name
                              cloudClient {
                                id
                                name
                              }
                            }
                            objectId
                            objectType
                            objectName
                          }
                        }
                    `
                })),
                map(({data}) => ({securityGroupFilters: data.securityGroupFilters})),
                tap(() => this._loading = false)
            )
            .subscribe(({securityGroupFilters}) => {
                this._securityGroupFilters = securityGroupFilters.filter(securityGroupFilter => !!securityGroupFilter.securityGroup.cloudClient) || [];
                this._filteredSecurityGroupFilters = this._securityGroupFilters
                    .filter(securityGroupFilter => securityGroupFilter.securityGroup.cloudClient.id === this._cloudClient$.getValue()?.id);
            });

        this._cloudClient$
            .pipe(takeUntil(this._destroy$))
            .subscribe(cloudClient => {
                this._filteredSecurityGroupFilters = this._securityGroupFilters
                    .filter(securityGroupFilter => securityGroupFilter.securityGroup.cloudClient.id === cloudClient.id);
            });
    }

    public ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    public onRefresh(): void {
        this._refresh$.next();
    }

    public onCreate(objectType: string): void {
        this._modalData$.next({objectType, cloudClient: this._cloudClient$.getValue(), multiCloudEnabled: this._multiCloudEnabled});
    }

    public onDelete(securityGroupFilter: SecurityGroupFilter): void {
        this._filterToDelete = securityGroupFilter;
    }

    public onConfirmDelete(): void {
        if (this._filterToDelete) {
            this._apollo.mutate({
                mutation: gql`
                    mutation DeleteSecurityGroupFilter($id: Int!){
                      deleteSecurityGroupFilter(id: $id) {
                        id
                      }
                    }
                `,
                variables: {
                    id: this._filterToDelete.id
                },
            }).subscribe(() => {
                this._notifierService.notify('success', 'Successfully delete security group filter rule');
                this._refresh$.next();
                this._filterToDelete = null;
            });
        }
    }

    public onDeleteModalClosed(): void {
        this._filterToDelete = null;
    }

    public onFilterCreated(): void {
        this._refresh$.next();
    }

}
