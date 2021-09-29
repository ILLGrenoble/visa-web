import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {FormControl, FormGroup} from '@angular/forms';
import {map, takeUntil} from 'rxjs/operators';
import {Apollo} from 'apollo-angular';
import gql from 'graphql-tag';
import {Subject} from 'rxjs';
import {CloudSecurityGroup} from '../../../core/graphql';
import {MatSnackBar} from '@angular/material/snack-bar';


@Component({
    selector: 'visa-admin-security-group-import',
    templateUrl: './security-group-import.component.html'
})
export class SecurityGroupImportComponent implements OnInit, OnDestroy {

    private _dialogRef: MatDialogRef<SecurityGroupImportComponent>;
    private _form: FormGroup;
    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _securityGroups: CloudSecurityGroup[];
    private readonly _snackBar: MatSnackBar;
    private readonly _apollo: Apollo;

    get form(): FormGroup {
        return this._form;
    }

    set form(value: FormGroup) {
        this._form = value;
    }

    get securityGroups(): CloudSecurityGroup[] {
        return this._securityGroups;
    }

    set securityGroups(value: CloudSecurityGroup[]) {
        this._securityGroups = value;
    }

    constructor(dialogRef: MatDialogRef<SecurityGroupImportComponent>,
                apollo: Apollo, @Inject(MAT_DIALOG_DATA) public data,
                snackBar: MatSnackBar) {
        this._dialogRef = dialogRef;
        this._apollo = apollo;
        this._snackBar = snackBar;
    }

    submit(): void {
        const {securityGroup} = this.form.value;
        this._apollo.query<any>({
            query: gql`
              query allSecurityGroups($filter: QueryFilter) {
                securityGroups(filter: $filter) {
                   id
                   name
                }
              }`,
            variables: {
                filter: {
                    query: 'name = :name',
                    parameters: [{
                        name: 'name',
                        value: securityGroup.name
                    }]
                }
            }
        }).pipe(
            takeUntil(this._destroy$),
            map(({data}) => data.securityGroups)
        ).subscribe(securityGroups => {
            if (securityGroups.length > 0) {
                this._snackBar.open(`This security group has already been imported`, 'OK', {duration: 4000});
            } else {
                this.importSecurityGroup(securityGroup);
            }
        });
    }

    private importSecurityGroup(securityGroup: CloudSecurityGroup): void {
        this._apollo.mutate({
            mutation: gql`
                mutation CreateSecurityGroup($input: String!){
                  createSecurityGroup(input: $input) {
                    id
                    name
                  }
                }
            `,
            variables: {
                input: securityGroup.name
            },
        }).toPromise().then((result: any) => {
            this._dialogRef.close(true);
        });
    }

    ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    ngOnInit(): void {
        this._apollo.query<any>({
            query: gql`
                      query {
                          cloudSecurityGroups {
                            name
                          }
                      }
                    `
        }).pipe(
            map(({data}) => ({cloudSecurityGroups: data.cloudSecurityGroups})),
            takeUntil(this._destroy$)
        ).subscribe(({cloudSecurityGroups}) => {
            this._securityGroups = cloudSecurityGroups;
            this.form = new FormGroup({
                securityGroup: new FormControl()
            });
        });
    }

    public onCancel(): void {
        this._dialogRef.close();
    }

}
