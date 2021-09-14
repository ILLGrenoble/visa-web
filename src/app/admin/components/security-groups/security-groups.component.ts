import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Apollo} from 'apollo-angular';
import gql from 'graphql-tag';
import {delay, map, startWith, switchMap, takeUntil, tap} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {SecurityGroupFilter} from '../../../core/graphql';
import {SecurityGroupFilterNewComponent} from '../security-group-filter-new';

@Component({
    selector: 'visa-admin-security-groups',
    templateUrl: './security-groups.component.html',
    styleUrls: ['./security-groups.component.scss']
})

export class SecurityGroupsComponent implements OnInit, OnDestroy {

    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _refresh$: Subject<void> = new Subject();

    private _loading: boolean;
    private _securityGroupFilters: SecurityGroupFilter[] = [];

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

    constructor(private apollo: Apollo,
                private snackBar: MatSnackBar,
                private dialog: MatDialog) {
    }

    public ngOnInit(): void {
        this._refresh$
            .pipe(
                startWith(0),
                takeUntil(this._destroy$),
                tap(() => this._loading = true),
                delay(500),
                switchMap(() => this.apollo.query<any>({
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

    public onCreate(): void {
        const dialogRef = this.dialog.open(SecurityGroupFilterNewComponent, {
            width: '600px',
        });
    }

    public onDelete(securityGroupFilter: SecurityGroupFilter): void {
        this.snackBar.open('Deleted security group', 'OK', {
            duration: 4000,
        });
        this._refresh$.next();
    }

}
