import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {map, takeUntil} from 'rxjs/operators';
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
    private _securityGroups: Map<number, CloudSecurityGroup[]> = new Map();
    private _filteredSecurityGroups: CloudSecurityGroup[];
    private _currentSecurityGroups: SecurityGroup[];
    private _cloudClient: CloudClient;
    private _multiCloudEnabled: boolean;

    private _modalData$: Subject<{currentSecurityGroups: SecurityGroup[], cloudClient: CloudClient, multiCloudEnabled: boolean}>;
    private _showEditModal = false;
    private _onSave$: EventEmitter<void> = new EventEmitter<void>();

    get showEditModal(): boolean {
        return this._showEditModal;
    }

    set showEditModal(value: boolean) {
        this._showEditModal = value;
    }

    @Input()
    set modalData$(value: Subject<{ currentSecurityGroups: SecurityGroup[], cloudClient: CloudClient, multiCloudEnabled: boolean }>) {
        this._modalData$ = value;
    }

    @Output()
    get onSave(): EventEmitter<void> {
        return this._onSave$;
    }

    get form(): FormGroup {
        return this._form;
    }

    set form(value: FormGroup) {
        this._form = value;
    }

    get filteredSecurityGroups(): CloudSecurityGroup[] {
        return this._filteredSecurityGroups;
    }

    get cloudClient(): CloudClient {
        return this._cloudClient;
    }

    get multiCloudEnabled(): boolean {
        return this._multiCloudEnabled;
    }

    constructor(private readonly _apollo: Apollo,
                private readonly _notifierService: NotifierService) {

        this.form = new FormGroup({
            securityGroup: new FormControl()
        });

    }

    ngOnInit(): void {
        this._modalData$.pipe(
            takeUntil(this._destroy$),
        ).subscribe(data => {
            const {cloudClient, multiCloudEnabled, currentSecurityGroups} = data;
            this._cloudClient = cloudClient;
            this._currentSecurityGroups = currentSecurityGroups;
            this._multiCloudEnabled = multiCloudEnabled;

            this._showEditModal = true;
            this._loadCloudSecurityGroups();

            // Reset form
            this.form.reset({
                securityGroup: null,
            });
        });
    }

    ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    private _loadCloudSecurityGroups(): void {
        const cloudId = this._cloudClient.id == null ? -1 : this._cloudClient.id;
        if (this._securityGroups.has(cloudId)) {
            this._filterSecurityGroups();
        } else {
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
                takeUntil(this._destroy$),
                map(({data}) => ({cloudSecurityGroups: data.cloudSecurityGroups})),
            ).subscribe(({cloudSecurityGroups}) => {
                this._securityGroups.set(cloudId, cloudSecurityGroups || []);
                this._filterSecurityGroups();
            });
        }
    }

    private _filterSecurityGroups(): void {
        const cloudId = this._cloudClient.id == null ? -1 : this._cloudClient.id;
        const allCloudSecurityGroups = this._securityGroups.get(cloudId);

        if (this._currentSecurityGroups) {
            this._filteredSecurityGroups = allCloudSecurityGroups.filter(cloudSecurityGroup => {
                return this._currentSecurityGroups.find(securityGroup => securityGroup.name === cloudSecurityGroup.name) == null;
            });
            this._filteredSecurityGroups.unshift(null);

        } else {
            // copy
            this._filteredSecurityGroups = allCloudSecurityGroups.map(securityGroup => securityGroup);
            this._filteredSecurityGroups.unshift(null);
        }
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
                this._showEditModal = false;
                this._onSave$.next();
            },
            error: (error) => {
                this._notifierService.notify('error', error);
            }
        });
    }

    public onCancel(): void {
        this._showEditModal = false;
    }

}
