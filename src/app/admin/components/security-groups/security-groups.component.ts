import {Component, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {Apollo} from 'apollo-angular';
import gql from 'graphql-tag';
import {delay, map, startWith, switchMap, takeUntil, tap} from 'rxjs/operators';
import {BehaviorSubject, Subject} from 'rxjs';
import {CloudClient, SecurityGroup} from '../../../core/graphql';
import {SecurityGroupImportComponent} from '../security-group-import';
import {SecurityGroupDeleteComponent} from '../security-group-delete';
import {NotifierService} from 'angular-notifier';
import {Title} from '@angular/platform-browser';

@Component({
    selector: 'visa-admin-security-groups',
    templateUrl: './security-groups.component.html'
})

export class SecurityGroupsComponent implements OnInit, OnDestroy {

    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _refresh$: Subject<void> = new Subject();

    private _loading: boolean;
    private _multiCloudEnabled: boolean;
    private _securityGroups: SecurityGroup[] = [];
    private _filteredSecurityGroups: SecurityGroup[] = [];
    private _cloudClient$: BehaviorSubject<CloudClient> = new BehaviorSubject<CloudClient>(null);

    get filteredSecurityGroups(): SecurityGroup[] {
        return this._filteredSecurityGroups;
    }

    get securityGroups(): SecurityGroup[] {
        return this._securityGroups;
    }

    set securityGroups(value: SecurityGroup[]) {
        this._securityGroups = value;
    }

    get loading(): boolean {
        return this._loading;
    }

    set loading(value: boolean) {
        this._loading = value;
    }

    @Output('onRefresh')
    get refresh$(): Subject<void> {
        return this._refresh$;
    }

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

    get multiCloudEnabled(): boolean {
        return this._multiCloudEnabled;
    }

    constructor(private _apollo: Apollo,
                private _notifierService: NotifierService,
                private _dialog: MatDialog,
                private _titleService: Title) {
    }

    public ngOnInit(): void {
        this._titleService.setTitle(`Security Groups | Cloud | Admin | VISA`);
        this._refresh$
            .pipe(
                startWith(0),
                takeUntil(this._destroy$),
                tap(() => this._loading = true),
                delay(500),
                switchMap(() => this._apollo.query<any>({
                    query: gql`
                      query {
                          securityGroups {
                            id
                            name
                            cloudClient {
                                id
                                name
                            }
                          }
                        }
                    `
                })),
                map(({data}) => ({securityGroups: data.securityGroups})),
                tap(() => this._loading = false)
            )
            .subscribe(({securityGroups}) => {
                this._securityGroups = securityGroups || [];
                this._filteredSecurityGroups = this._securityGroups
                    .filter(securityGroup => securityGroup.cloudClient.id === this._cloudClient$.getValue()?.id);
            });

        this._cloudClient$
            .pipe(takeUntil(this._destroy$))
            .subscribe(cloudClient => {
                this._filteredSecurityGroups = this._securityGroups
                    .filter(securityGroup => securityGroup.cloudClient.id === cloudClient.id);
            });
    }

    public ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    public onRefresh(): void {
        this._refresh$.next();
    }

    public onDelete(securityGroup: SecurityGroup): void {

        const dialogRef = this._dialog.open(SecurityGroupDeleteComponent, {
            width: '400px'
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this._apollo.mutate({
                    mutation: gql`
                    mutation DeleteSecurityGroup($id: Int!){
                      deleteSecurityGroup(id: $id) {
                        id
                      }
                    }
                `,
                    variables: {
                        id: securityGroup.id
                    },
                }).toPromise().then(_ => {
                    this._notifierService.notify('success', 'Successfully deleted security group');
                    this._refresh$.next();
                });
            }
        });
    }

    public onImport(): void {
        const dialogRef = this._dialog.open(SecurityGroupImportComponent, {
            width: '800px', data: {
                cloudClient: this._cloudClient$.getValue(),
                currentSecurityGroups: this._filteredSecurityGroups,
                multiCloudEnabled: this._multiCloudEnabled,
            }
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this._refresh$.next();
            }
        });

    }

}
