import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Apollo} from 'apollo-angular';
import gql from 'graphql-tag';
import {delay, map, startWith, switchMap, takeUntil, tap} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {SecurityGroupFilter} from '../../../core/graphql';
import {SecurityGroupFilterNewComponent} from '../security-group-filter-new';
import {SecurityGroupFilterDeleteComponent} from '../security-group-filter-delete';

@Component({
    selector: 'visa-admin-security-group-filters',
    templateUrl: './security-group-filters.component.html',
})
export class SecurityGroupFiltersComponent implements OnInit, OnDestroy {

    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _refresh$: Subject<void> = new Subject();

    private _loading: boolean;
    private _securityGroupFilters: SecurityGroupFilter[] = [];
    private _apollo: Apollo;
    private _snackBar: MatSnackBar;
    private _dialog: MatDialog;

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

    constructor(apollo: Apollo,
                snackBar: MatSnackBar,
                dialog: MatDialog) {
        this._apollo = apollo;
        this._snackBar = snackBar;
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
                this._securityGroupFilters = securityGroupFilters;
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
                objectType
            }
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this._snackBar.open('Successfully created new security group filter rule', 'OK', {duration: 4000});
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
                    this._snackBar.open('Successfully delete security group filter rule', 'OK', {
                        duration: 4000,
                    });
                    this._refresh$.next();
                });
            }
        });
    }

}
