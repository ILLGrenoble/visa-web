import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {FormControl, FormGroup} from '@angular/forms';
import {filter, map, takeUntil} from 'rxjs/operators';
import {Apollo} from 'apollo-angular';
import gql from 'graphql-tag';
import {Subject} from 'rxjs';
import {CloudClient, CloudSecurityGroup, SecurityGroup, SecurityGroupInput} from '../../../core/graphql';
import {NotifierService} from 'angular-notifier';


@Component({
    selector: 'visa-admin-security-group-import',
    templateUrl: './security-group-import.component.html'
})
export class SecurityGroupImportComponent implements OnInit, OnDestroy {

    private _form: FormGroup;
    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _securityGroups: CloudSecurityGroup[];
    private _currentSecurityGroups: SecurityGroup[];
    private readonly _cloudClient: CloudClient;
    private readonly _multiCloudEnabled: boolean;

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

    get cloudClient(): CloudClient {
        return this._cloudClient;
    }

    get multiCloudEnabled(): boolean {
        return this._multiCloudEnabled;
    }

    constructor(private readonly _dialogRef: MatDialogRef<SecurityGroupImportComponent>,
                private readonly _apollo: Apollo,
                @Inject(MAT_DIALOG_DATA) {cloudClient, currentSecurityGroups, multiCloudEnabled},
                private readonly _notifierService: NotifierService) {
        this._cloudClient = cloudClient;
        this._currentSecurityGroups = currentSecurityGroups;
        this._multiCloudEnabled = multiCloudEnabled;

        this._dialogRef.keydownEvents().pipe(filter(event => event.key === 'Escape')).subscribe(() => this._dialogRef.close());
        this._dialogRef.backdropClick().subscribe(() => this._dialogRef.close());
    }

    submit(): void {
        const {securityGroup} = this.form.value;
        this._apollo.query<any>({
            query: gql`
              query securityGroupsByName($name: String!) {
                  securityGroupsByName(name: $name) {
                    id
                    name
                    cloudId
                 }
              }`,
            variables: {
                name: securityGroup.name
            }
        }).pipe(
            takeUntil(this._destroy$),
            map(({data}) => data.securityGroupsByName)
        ).subscribe(securityGroups => {
            const existingSecurityGroups = securityGroups
                .filter(aSecurityGroup => aSecurityGroup.cloudId === this._cloudClient.id);
            if (existingSecurityGroups > 0) {
                this._notifierService.notify('warning', `This security group has already been imported`);
            } else {
                this.importSecurityGroup(securityGroup);
            }
        });
    }

    private importSecurityGroup(securityGroup: CloudSecurityGroup): void {
        const input = {
            name: securityGroup.name,
            cloudId: this._cloudClient.id,
        } as SecurityGroupInput;

        this._apollo.mutate({
            mutation: gql`
                mutation CreateSecurityGroup($input: SecurityGroupInput!){
                  createSecurityGroup(input: $input) {
                    id
                    name
                    cloudClient {
                        id
                        name
                    }
                  }
                }
            `,
            variables: { input },
        }).pipe(
            takeUntil(this._destroy$)
        ).subscribe({
            next: () => {
                this._notifierService.notify('success', 'Successfully imported security group from the cloud');
                this._dialogRef.close(true);
            },
            error: (error) => {
                this._notifierService.notify('error', error);
            }
        });
    }

    ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    ngOnInit(): void {
        this._apollo.query<any>({
            query: gql`
                      query cloudSecurityGroups($cloudId: Int!) {
                          cloudSecurityGroups(cloudId: $cloudId) {
                            name
                          }
                      }
                    `,
            variables: { cloudId: this._cloudClient.id },
        }).pipe(
            map(({data}) => ({cloudSecurityGroups: data.cloudSecurityGroups})),
            takeUntil(this._destroy$)
        ).subscribe(({cloudSecurityGroups}) => {
            this._securityGroups = (cloudSecurityGroups || [])
                .filter(cloudSecurityGroup => this._currentSecurityGroups
                    .find(securityGroup => securityGroup.name === cloudSecurityGroup.name) == null);
            this.form = new FormGroup({
                securityGroup: new FormControl()
            });
        });
    }

    public onCancel(): void {
        this._dialogRef.close();
    }

}
