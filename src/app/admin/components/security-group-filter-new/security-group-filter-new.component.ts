import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {FormControl, FormGroup} from '@angular/forms';
import {map, takeUntil} from 'rxjs/operators';
import {Apollo} from 'apollo-angular';
import gql from 'graphql-tag';
import {Subject} from 'rxjs';
import {SecurityGroup} from '../../../core/graphql';
import {MatSnackBar} from '@angular/material/snack-bar';


@Component({
    selector: 'visa-admin-security-group-filter-new',
    templateUrl: './security-group-filter-new.component.html'
})
export class SecurityGroupFilterNewComponent implements OnInit, OnDestroy {

    private _dialogRef: MatDialogRef<SecurityGroupFilterNewComponent>;
    private _form: FormGroup;
    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _securityGroups: SecurityGroup[];
    private _objectIdentifiers: { id: number, name: string }[];
    private readonly _snackBar: MatSnackBar;
    private readonly _objectType: string;
    private readonly _apollo: Apollo;

    get form(): FormGroup {
        return this._form;
    }

    set form(value: FormGroup) {
        this._form = value;
    }

    get securityGroups(): SecurityGroup[] {
        return this._securityGroups;
    }

    set securityGroups(value: SecurityGroup[]) {
        this._securityGroups = value;
    }


    get objectIdentifiers(): { id: number; name: string }[] {
        return this._objectIdentifiers;
    }

    set objectIdentifiers(value: { id: number; name: string }[]) {
        this._objectIdentifiers = value;
    }

    get objectType(): string {
        return this._objectType;
    }

    constructor(dialogRef: MatDialogRef<SecurityGroupFilterNewComponent>,
                apollo: Apollo, @Inject(MAT_DIALOG_DATA) public data,
                snackBar: MatSnackBar) {
        this._dialogRef = dialogRef;
        this._apollo = apollo;
        this._snackBar = snackBar;
        this._objectType = data.objectType;
    }

    submit(): void {
        const {securityGroup, objectIdentifier} = this.form.value;
        this._apollo.query<any>({
            query: gql`
               query SecurityGroupFilterBySecurityIdAndObjectIdAndType($securityGroupId: Int!, $objectId: Int!, $objectType: String!) {
                    securityGroupFilterBySecurityIdAndObjectIdAndType(securityGroupId: $securityGroupId, objectId: $objectId, objectType: $objectType) {
                        id
                    }
                }
                    `,
            variables: {
                securityGroupId: securityGroup.id,
                objectId: objectIdentifier.id,
                objectType: this._objectType
            }
        }).pipe(
            takeUntil(this._destroy$),
        ).subscribe(({data}) => {
            if (data.securityGroupFilterByObjectIdAndType) {
                this._snackBar.open(`A rule already exists for these given parameters`, 'OK', {duration: 4000});
            } else {
                this.createFilter(securityGroup, objectIdentifier);
            }
        });
    }

    private createFilter(securityGroup: SecurityGroup, objectIdentifier: { id: number, name: string }): void {
        this._apollo.mutate({
            mutation: gql`
                mutation CreateSecurityGroupFilter($input: SecurityGroupFilterInput!){
                  createSecurityGroupFilter(input: $input) {
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
            `,
            variables: {
                input: {
                    objectId: objectIdentifier.id,
                    objectType: this._objectType,
                    securityGroupId: securityGroup.id
                }
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
                          securityGroups {
                            id
                            name
                          }
                          roles {
                            id
                            name
                          }
                          instruments {
                            id
                            name
                          }
                      }
                    `
        }).pipe(
            map(({data}) => ({securityGroups: data.securityGroups, roles: data.roles, instruments: data.instruments})),
            takeUntil(this._destroy$)
        ).subscribe(({securityGroups, roles, instruments}) => {
            this._securityGroups = securityGroups;
            if (this._objectType === 'ROLE') {
                this._objectIdentifiers = roles.map(role => {
                    return {id: role.id, name: role.name};
                });
            } else if (this._objectType === 'INSTRUMENT') {
                this._objectIdentifiers = instruments.map(instrument => {
                    return {id: instrument.id, name: instrument.name};
                });
            }
            this.form = new FormGroup({
                securityGroup: new FormControl(this._securityGroups[0]),
                objectIdentifier: new FormControl(this._objectIdentifiers[0])
            });
        });

    }

    public onCancel(): void {
        this._dialogRef.close();
    }

}
