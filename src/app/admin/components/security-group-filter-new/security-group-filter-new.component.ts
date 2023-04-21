import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {UntypedFormControl, UntypedFormGroup} from '@angular/forms';
import {filter, map, takeUntil} from 'rxjs/operators';
import {Apollo} from 'apollo-angular';
import gql from 'graphql-tag';
import {lastValueFrom, Subject} from 'rxjs';
import {CloudClient, SecurityGroup, SecurityGroupFilter, SecurityGroupFilterInput} from '../../../core/graphql';
import {NotifierService} from 'angular-notifier';


@Component({
    selector: 'visa-admin-security-group-filter-new',
    templateUrl: './security-group-filter-new.component.html'
})
export class SecurityGroupFilterNewComponent implements OnInit, OnDestroy {

    private _form: UntypedFormGroup;
    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _securityGroups: SecurityGroup[];
    private _objectIdentifiers: { id: number, name: string }[];
    private readonly _objectType: string;
    private readonly _cloudClient: CloudClient;
    private readonly _multiCloudEnabled: boolean;

    get form(): UntypedFormGroup {
        return this._form;
    }

    set form(value: UntypedFormGroup) {
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

    get cloudClient(): CloudClient {
        return this._cloudClient;
    }

    get multiCloudEnabled(): boolean {
        return this._multiCloudEnabled;
    }

    constructor(private readonly _dialogRef: MatDialogRef<SecurityGroupFilterNewComponent>,
                private readonly _apollo: Apollo,
                @Inject(MAT_DIALOG_DATA) {objectType, cloudClient, multiCloudEnabled},
                private readonly _notifierService: NotifierService) {
        this._objectType = objectType;
        this._cloudClient = cloudClient;
        this._multiCloudEnabled = multiCloudEnabled;

        this._dialogRef.keydownEvents().subscribe(event => {
            if (event.key === 'Escape') {
                this._dialogRef.close();
            }
        });

        this._dialogRef.backdropClick().subscribe(_ => this._dialogRef.close());
    }

    submit(): void {
        const {securityGroup, objectIdentifier} = this.form.value;
        this._apollo.query<any>({
            query: gql`
               query allSecurityGroupFilters($filter: QueryFilter!) {
                     securityGroupFilters(filter: $filter) {
                        id
                        securityGroup {
                            cloudClient {
                                id
                            }
                        }
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
            map(({data}) => ({securityGroupFilters: data.securityGroupFilters})),
            takeUntil(this._destroy$),
        ).subscribe(({securityGroupFilters}) => {
            if (securityGroupFilters.length > 0) {
                this._notifierService.notify('warning', `A rule already exists for these given parameters`);
            } else {
                this.createFilter(securityGroup, objectIdentifier);
            }
        });
    }

    private createFilter(securityGroup: SecurityGroup, objectIdentifier: { id: number, name: string }): void {
        const input = {
            objectId: objectIdentifier.id,
            objectType: this._objectType,
            securityGroupId: securityGroup.id
        } as SecurityGroupFilterInput;

        const source$ = this._apollo.mutate({
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
            variables: { input },
        }).pipe(
            takeUntil(this._destroy$)
        );
        lastValueFrom(source$).then(() => {
            this._notifierService.notify('success', 'Successfully created new security group filter rule');
            this._dialogRef.close(true);
        }).catch((error) => {
            this._notifierService.notify('error', error);
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
                            cloudClient {
                                id
                                name
                            }
                          }
                          rolesAndGroups {
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
            map(({data}) => ({securityGroups: data.securityGroups, roles: data.rolesAndGroups, instruments: data.instruments})),
            takeUntil(this._destroy$)
        ).subscribe(({securityGroups, roles, instruments}) => {
            this._securityGroups = securityGroups.filter(securityGroup => securityGroup.cloudClient.id === this._cloudClient.id);
            if (this._objectType === 'ROLE') {
                this._objectIdentifiers = roles.map(role => {
                    return {id: role.id, name: role.name};
                });
            } else if (this._objectType === 'INSTRUMENT') {
                this._objectIdentifiers = instruments.map(instrument => {
                    return {id: instrument.id, name: instrument.name};
                });
            }
            this.form = new UntypedFormGroup({
                securityGroup: new UntypedFormControl(),
                objectIdentifier: new UntypedFormControl()
            });
        });

    }

    public onCancel(): void {
        this._dialogRef.close();
    }

}
