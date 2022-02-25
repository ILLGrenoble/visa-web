import {Component, OnDestroy, OnInit, Output} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {Apollo} from 'apollo-angular';
import gql from 'graphql-tag';
import {delay, map, startWith, switchMap, takeUntil, tap} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {SecurityGroup} from '../../../core/graphql';
import {SecurityGroupImportComponent} from '../security-group-import';
import {SecurityGroupDeleteComponent} from '../security-group-delete';
import {NotifierService} from 'angular-notifier';

@Component({
    selector: 'visa-admin-security-groups',
    templateUrl: './security-groups.component.html'
})

export class SecurityGroupsComponent implements OnInit, OnDestroy {

    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _refresh$: Subject<void> = new Subject();

    private _loading: boolean;
    private _securityGroups: SecurityGroup[] = [];
    private _apollo: Apollo;
    private _notifierService: NotifierService;
    private _dialog: MatDialog;

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
                          securityGroups {
                            id
                            name
                          }
                        }
                    `
                })),
                map(({data}) => ({securityGroups: data.securityGroups})),
                tap(() => this._loading = false)
            )
            .subscribe(({securityGroups}) => {
                this._securityGroups = securityGroups;
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
            width: '600px'
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this._notifierService.notify('success', 'Successfully imported security group from the cloud');
                this._refresh$.next();
            }
        });

    }

}
