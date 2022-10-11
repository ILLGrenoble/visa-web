import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {Apollo} from 'apollo-angular';
import gql from 'graphql-tag';
import {delay, map, startWith, switchMap, takeUntil, tap} from 'rxjs/operators';
import {BehaviorSubject, Subject} from 'rxjs';
import {CloudClient, SecurityGroup, SecurityGroupFilter} from '../../../core/graphql';
import {SecurityGroupFilterNewComponent} from '../security-group-filter-new';
import {SecurityGroupFilterDeleteComponent} from '../security-group-filter-delete';
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
    private _dialog: MatDialog;

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

    constructor(apollo: Apollo,
                notifierService: NotifierService,
                dialog: MatDialog) {
        this._apollo = apollo;
        this._notifierService = notifierService;
        this._dialog = dialog;
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
                this._securityGroupFilters = securityGroupFilters || [];
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
        const dialogRef = this._dialog.open(SecurityGroupFilterNewComponent, {
            width: '600px',
            data: {
                objectType,
                cloudClient: this._cloudClient$.getValue(),
                multiCloudEnabled: this._multiCloudEnabled,
            }
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this._refresh$.next();
            }
        });
    }

    public onDelete(securityGroupFilter: SecurityGroupFilter): void {
        const dialogRef = this._dialog.open(SecurityGroupFilterDeleteComponent, {
            width: '400px'
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this._apollo.mutate({
                    mutation: gql`
                    mutation DeleteSecurityGroupFilter($id: Int!){
                      deleteSecurityGroupFilter(id: $id) {
                        id
                      }
                    }
                `,
                    variables: {
                        id: securityGroupFilter.id
                    },
                }).toPromise().then(_ => {
                    this._notifierService.notify('success', 'Successfully delete security group filter rule');
                    this._refresh$.next();
                });
            }
        });
    }

}
