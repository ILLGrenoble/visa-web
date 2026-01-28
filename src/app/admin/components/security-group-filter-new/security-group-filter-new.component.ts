import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {map, takeUntil} from 'rxjs/operators';
import {Apollo} from 'apollo-angular';
import gql from 'graphql-tag';
import {Subject} from 'rxjs';
import {
    CloudClient,
    Flavour,
    Instrument,
    Role,
    SecurityGroup,
    SecurityGroupFilterInput
} from '../../../core/graphql';
import {NotifierService} from 'angular-notifier';


@Component({
    selector: 'visa-admin-security-group-filter-new',
    templateUrl: './security-group-filter-new.component.html'
})
export class SecurityGroupFilterNewComponent implements OnInit, OnDestroy {

    private _form: FormGroup;
    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _securityGroups: SecurityGroup[];
    private _roles: Role[];
    private _instruments: Instrument[];
    private _flavours: Flavour[];

    private _filteredSecurityGroups: SecurityGroup[];
    private _objectIdentifiers: { id: number, name: string }[];
    private _objectType: string;
    private _cloudClient: CloudClient;
    private _multiCloudEnabled: boolean;

    private _modalData$: Subject<{objectType: string; cloudClient: CloudClient; multiCloudEnabled: boolean}>;
    private _showEditModal = false;
    private _onSave$: EventEmitter<void> = new EventEmitter<void>();


    get showEditModal(): boolean {
        return this._showEditModal;
    }

    set showEditModal(value: boolean) {
        this._showEditModal = value;
    }

    @Input()
    set modalData$(value: Subject<{ objectType: string; cloudClient: CloudClient; multiCloudEnabled: boolean }>) {
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

    get filteredSecurityGroups(): SecurityGroup[] {
        return this._filteredSecurityGroups;
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

    constructor(private readonly _apollo: Apollo,
                private readonly _notifierService: NotifierService) {
        this.form = new FormGroup({
            securityGroup: new FormControl(),
            objectIdentifier: new FormControl()
        });
    }

    ngOnInit(): void {
        this._modalData$.pipe(
            takeUntil(this._destroy$),
        ).subscribe(data => {
            const {objectType, cloudClient, multiCloudEnabled} = data;

            this._objectType = objectType;
            this._cloudClient = cloudClient;
            this._multiCloudEnabled = multiCloudEnabled;

            this._filterSecurityGroups();

            this.form.reset({
                securityGroup: null,
                objectIdentifier: null,
            });

            this._showEditModal = true;
        });

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
                          flavours {
                            id
                            name
                          }
                      }
                    `
        }).pipe(
            map(({data}) => ({securityGroups: data.securityGroups, roles: data.rolesAndGroups, instruments: data.instruments, flavours: data.flavours})),
            takeUntil(this._destroy$)
        ).subscribe(({securityGroups, roles, instruments, flavours}) => {
            this._securityGroups = securityGroups;
            this._roles = roles;
            this._instruments = instruments;
            this._flavours = flavours;
        });

    }

    ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    submit(): void {
        const {securityGroup, objectIdentifier} = this.form.value;
        this._apollo.query<any>({
            query: gql`
               query securityGroupFilter($securityGroupId: Int!, $objectId: Int!, $objectType: String!) {
                     securityGroupFilter(securityGroupId: $securityGroupId, objectId: $objectId, objectType: $objectType) {
                        id
                    }
                }
                    `,
            variables: {
                securityGroupId: securityGroup.id,
                objectId: objectIdentifier.id,
                objectType: this._objectType,
            }
        }).pipe(
            map(({data}) => ({securityGroupFilter: data.securityGroupFilter})),
            takeUntil(this._destroy$),
        ).subscribe(({securityGroupFilter}) => {
            if (securityGroupFilter != null) {
                this._notifierService.notify('warning', `A rule already exists for these given parameters`);
            } else {
                this.createFilter(securityGroup, objectIdentifier);
            }
        });
    }

    private _filterSecurityGroups(): void {
        if (this._objectType != null) {
            this._filteredSecurityGroups = this._securityGroups
                .filter(securityGroup => !!securityGroup.cloudClient)
                .filter(securityGroup => securityGroup.cloudClient.id === this._cloudClient.id);
            if (this._objectType === 'ROLE') {
                this._objectIdentifiers = this._roles.map(role => {
                    return {id: role.id, name: role.name};
                });

            } else if (this._objectType === 'FLAVOUR') {
                this._objectIdentifiers = this._flavours.map(flavour => {
                    return {id: flavour.id, name: flavour.name};
                });

            } else if (this._objectType === 'INSTRUMENT') {
                this._objectIdentifiers = this._instruments.map(instrument => {
                    return {id: instrument.id, name: instrument.name};
                });
            }
            this._objectIdentifiers.unshift(null);
        }
    }

    private createFilter(securityGroup: SecurityGroup, objectIdentifier: { id: number, name: string }): void {
        const input = {
            objectId: objectIdentifier.id,
            objectType: this._objectType,
            securityGroupId: securityGroup.id
        } as SecurityGroupFilterInput;

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
            variables: { input },
        }).pipe(
            takeUntil(this._destroy$)
        ).subscribe({
            next: () => {
                this._notifierService.notify('success', 'Successfully created new security group filter rule');
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
