import {Component, OnDestroy, OnInit, Output, ViewEncapsulation} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {Apollo} from 'apollo-angular';
import gql from 'graphql-tag';
import {delay, map, startWith, switchMap, takeUntil, tap} from 'rxjs/operators';
import {Subject} from 'rxjs';
import { Role } from '../../../core/graphql';
import {NotifierService} from 'angular-notifier';
import {UserGroupEditComponent} from "../user-group-edit";
import {UserGroupDeleteComponent} from "../user-group-delete";

@Component({
    selector: 'visa-admin-user-groups',
    templateUrl: './user-groups.component.html',
    encapsulation: ViewEncapsulation.None,
    styleUrls: ['./user-groups.component.scss']
})

export class UserGroupsComponent implements OnInit, OnDestroy {

    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _refresh$: Subject<void> = new Subject();

    private _loading: boolean;
    private _userGroups: Role[] = [];

    get userGroups(): Role[] {
        return this._userGroups;
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

    constructor(private _apollo: Apollo,
                private _notifierService: NotifierService,
                private _dialog: MatDialog) {
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
                          groups {
                            id
                            name
                            description
                          }
                        }
                    `
                })),
                map(({data}) => ({groups: data.groups})),
                tap(() => this._loading = false)
            )
            .subscribe(({groups}) => {
                this._userGroups = groups || [];
            });
    }

    public ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    public onRefresh(): void {
        this._refresh$.next();
    }

    public onDelete(userGroup: Role): void {

        const dialogRef = this._dialog.open(UserGroupDeleteComponent, {
            width: '400px'
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this._apollo.mutate({
                    mutation: gql`
                    mutation DeleteRole($id: Int!){
                      deleteRole(id: $id)
                    }
                `,
                    variables: {
                        id: userGroup.id
                    },
                }).subscribe(_ => {
                    this._notifierService.notify('success', 'Successfully deleted user group');
                    this._refresh$.next();
                });
            }
        });
    }

    public onCreate(): void {
        const dialogRef = this._dialog.open(UserGroupEditComponent, {
            width: '800px', data: {}
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this._refresh$.next();
            }
        });

    }

    public onEdit(userGroup: Role): void {
        const dialogRef = this._dialog.open(UserGroupEditComponent, {
            width: '800px', data: {
                role: userGroup
            }
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this._refresh$.next();
            }
        });

    }

}
