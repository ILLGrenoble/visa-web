import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {FormControl, FormGroup} from '@angular/forms';
import {map, takeUntil} from 'rxjs/operators';
import {Apollo} from 'apollo-angular';
import gql from 'graphql-tag';
import {Subject} from 'rxjs';
import {SecurityGroup} from '../../../core/graphql';
import {NotifierService} from 'angular-notifier';


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
    private readonly _notifierService: NotifierService;
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

    get objectType(): string {
        return this._objectType;
    }

    constructor(dialogRef: MatDialogRef<SecurityGroupFilterNewComponent>,
                apollo: Apollo, @Inject(MAT_DIALOG_DATA) public data,
                notifierService: NotifierService) {
        this._dialogRef = dialogRef;
        this._apollo = apollo;
        this._notifierService = notifierService;
        this._objectType = data.objectType;
    }

    submit(): void {
        const {securityGroup, objectIdentifier} = this.form.value;
        this._apollo.query<any>({
            query: gql`
               query allSecurityGroupFilters($filter: QueryFilter!) {
                     securityGroupFilters(filter: $filter) {
                       id
                    }
                }
                    `,
            variables: {

                filter: {
                    query: 'sg.id = :securityGroupId AND objectId = :objectId AND objectType = :objectType',
                    parameters: [{
                        name: 'securityGroupId',
                        value: securityGroup.id
                    },
                        {
                            name: 'objectId',
                            value: objectIdentifier.id
                        },
                        {
                            name: 'objectType',
                            value: this._objectType
                        }]
                }
            }
        }).pipe(
            takeUntil(this._destroy$),
        ).subscribe(({data}) => {
            if (data.securityGroupFilters.length > 0) {
                this._notifierService.notify('warning', `A rule already exists for these given parameters`);
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
                securityGroup: new FormControl(),
                objectIdentifier: new FormControl()
            });
        });

    }

    public onCancel(): void {
        this._dialogRef.close();
    }

}
