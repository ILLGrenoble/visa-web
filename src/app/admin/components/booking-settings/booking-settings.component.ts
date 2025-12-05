import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {Subject} from 'rxjs';
import {Apollo} from 'apollo-angular';
import {NotifierService} from 'angular-notifier';
import {Title} from '@angular/platform-browser';
import {
    AbstractControl,
    FormArray,
    FormBuilder,
    FormControl,
    FormGroup,
    ValidationErrors,
    Validators
} from "@angular/forms";
import {
    Role,
    Flavour,
    CloudClient,
    BookingFlavourRoleConfiguration,
     BookingConfiguration
} from "../../../core/graphql";
import gql from "graphql-tag";
import {map, takeUntil, tap} from "rxjs/operators";


@Component({
    selector: 'visa-admin-booking-settings',
    templateUrl: './booking-settings.component.html',
    styleUrls: ['./booking-settings.component.scss'],
})
export class BookingSettingsComponent implements OnInit, OnDestroy {

    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _loading: boolean;

    private _form: FormGroup = new FormGroup({
        enabled: new FormControl(false, Validators.required),
        maxInstancesPerReservation: new FormControl(null),
        maxDaysInAdvance: new FormControl(null),
        maxDaysReservation: new FormControl(null),
        roles: new FormControl([]),
        flavours: new FormControl([]),
        flavoursSettings: this._formBuilder.array([], (control) => this._flavoursValidator(control)),
    });

    private _allUserRole = {id: null, name: 'ALL USERS', description: '', expiresAt: null};
    private _roles: Role[];
    private _rolesForFlavourConfig: Role[] = [];
    private _allFlavours: Flavour[];
    private _flavours: Flavour[];
    private _flavoursForConfig: Flavour[] = [];
    private _cloudClients: CloudClient[] = [];
    private _multiCloudEnabled = false;
    private _previousSelectedCloudClient: CloudClient;
    private _selectedCloudClient: CloudClient;
    private _showSaveBeforeCloudClientChangeModal = false;

    constructor(private readonly _apollo: Apollo,
                private readonly _notifierService: NotifierService,
                private readonly _formBuilder: FormBuilder,
                private readonly _titleService: Title) {
    }

    get loading(): boolean {
        return this._loading;
    }

    get form(): FormGroup {
        return this._form;
    }

    get cloudClients(): CloudClient[] {
        return this._cloudClients;
    }

    get multiCloudEnabled(): boolean {
        return this._multiCloudEnabled;
    }

    get roles(): Role[] {
        return this._roles;
    }

    get rolesForFlavourConfig(): Role[] {
        return this._rolesForFlavourConfig;
    }

    get flavours(): Flavour[] {
        return this._flavours;
    }

    get flavoursForConfig(): Flavour[] {
        return this._flavoursForConfig;
    }

    get bookingEnabled(): boolean {
        return this._form.controls.enabled.value;
    }

    get flavoursFormArray(): FormArray {
        return this._form.get('flavoursSettings') as FormArray;
    }

    get selectedCloudClient(): CloudClient {
        return this._selectedCloudClient;
    }

    set selectedCloudClient(value: CloudClient) {
        this._selectedCloudClient = value;
    }

    get showSaveBeforeCloudClientChangeModal(): boolean {
        return this._showSaveBeforeCloudClientChangeModal;
    }

    set showSaveBeforeCloudClientChangeModal(value: boolean) {
        this._showSaveBeforeCloudClientChangeModal = value;
    }

    public ngOnInit(): void {
        this._titleService.setTitle(`Settings | Booking | Admin | VISA`);

        this._loading = true;
        this._apollo.query<any>({
            query: gql`
                query bookingSettings {
                    flavours {
                        id
                        name
                        cloudId
                    }
                    roles {
                        id
                        name
                    }
                    cloudClients {
                        id
                        name
                    }
                }
            `,
        }).pipe(
            takeUntil(this._destroy$),
            map(({data}) => data),
            tap(() => this._loading = false)
        ).subscribe(({flavours, roles, cloudClients}) => {
            this._allFlavours = flavours;
            this._roles = roles;
            this._updateRolesForFlavourConfig();
            this._cloudClients = cloudClients;
            this._multiCloudEnabled = cloudClients.length > 1;

            this._selectedCloudClient = cloudClients[0];
            this._loadSettings();
        });

        this._form.get('roles').valueChanges.subscribe(() => {
            this._updateRolesForFlavourConfig();
            this._revalidateForm(this.flavoursFormArray);
        });

        this._form.get('flavours').valueChanges.subscribe(() => {
            this._updateFlavoursForConfig();
            this._revalidateForm(this.flavoursFormArray);
        });
    }

    public ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }


    protected addFlavourSettings() {
        const flavourGroup = this._createFlavourSettingsGroup();
        this.flavoursFormArray.push(flavourGroup);
    }

    protected addRoleSettings(flavourSettingsGroup: FormGroup): void {
        const flavourRoleGroup = this._createFlavourRoleSettingsGroup();
        const rolesArray = flavourSettingsGroup.get('roles') as FormArray;
        rolesArray.push(flavourRoleGroup);
    }

    protected deleteRoleSettings(flavourSettingsGroup: FormGroup, flavoursArrayIndex: number, rolesArrayIndex: number): void {
        const rolesArray = flavourSettingsGroup.get('roles') as FormArray;
        rolesArray.removeAt(rolesArrayIndex);
        if (rolesArray.length == 0) {
            this.flavoursFormArray.removeAt(flavoursArrayIndex);
        }
        this._form.markAsDirty();
    }

    protected compareCloudClient(cloudClient1: CloudClient, cloudClient2: CloudClient): boolean {
        if (cloudClient1 == null || cloudClient2 == null) {
            return false;
        }
        return cloudClient1.id === cloudClient2.id;
    }

    protected compareRole(role1: Role, role2: Role): boolean {
        if (role1 == null || role2 == null) {
            return false;
        }
        return role1.id === role2.id;
    }

    protected compareFlavour(flavour1: Flavour, flavour2: Flavour): boolean {
        if (flavour1 == null || flavour2 == null) {
            return false;
        }
        return flavour1.id === flavour2.id;
    }

    protected onCloudChange(): void {
        if (this._form.dirty && this._selectedCloudClient !== this._previousSelectedCloudClient) {
            this._showSaveBeforeCloudClientChangeModal = true;

        } else {
            this.continueWithoutSaveOnCloudClientChange();
        }
        this._previousSelectedCloudClient = this._selectedCloudClient;
    }

    protected saveOnCloudClientChange(): void {
        this.saveSettings();
        this._loadSettings();
        this._showSaveBeforeCloudClientChangeModal = false;
    }

    protected continueWithoutSaveOnCloudClientChange(): void {
        this._loadSettings();
        this._showSaveBeforeCloudClientChangeModal = false;
    }

    protected saveSettings(): void {
        const {enabled, maxInstancesPerReservation, maxDaysInAdvance, maxDaysReservation, roles, flavours, flavoursSettings} = this._form.value;

        const flavourRoleConfigurations = flavoursSettings.flatMap(flavourSettings => {
            const {flavour, roles} = flavourSettings;
            return roles.map(roleSettings => {
                const {role, maxInstancesPerReservation, maxDaysReservation} = roleSettings;
                return {
                    flavourId: flavour.id,
                    roleId: role.id,
                    maxInstancesPerReservation: maxInstancesPerReservation ? maxInstancesPerReservation : null,
                    maxDaysReservation: maxDaysReservation ? maxDaysReservation : null,
                };
            })
        });

        const input = {
            cloudId: this._selectedCloudClient.id,
            enabled,
            maxInstancesPerReservation: maxInstancesPerReservation ? maxInstancesPerReservation : null,
            maxDaysInAdvance : maxDaysInAdvance ? maxDaysInAdvance : null,
            maxDaysReservation : maxDaysReservation ? maxDaysReservation : null,
            roleIds: (roles || []).map(role => role.id),
            flavourIds: (flavours || []).map(flavour => flavour.id),
            flavourRoleConfigurations
        }

        this._apollo.mutate<any>({
            mutation: gql`
                mutation createOrUpdateBookingConfiguration($input: BookingConfigurationInput!){
                    createOrUpdateBookingConfiguration(input: $input) {
                        enabled
                        maxInstancesPerReservation
                        maxDaysInAdvance
                        maxDaysReservation
                        cloudId
                        flavours {
                            id
                            name
                        }
                        roles {
                            id
                            name
                        }
                        flavourRoleConfigurations {
                            flavour {
                                id
                                name
                            }
                            role {
                                id
                                name
                            }
                            maxInstancesPerReservation
                            maxDaysReservation
                        }
                    }
                }
            `,
            variables: {input},
        }).pipe(
            takeUntil(this._destroy$),
            map(({data}) => data),
        ).subscribe({
            next: ({createOrUpdateBookingConfiguration}) => {
                this._resetForm(createOrUpdateBookingConfiguration);
                this._notifierService.notify('success', 'Booking settings updated');
            },
            error: (error) => {
                this._notifierService.notify('error', error);
            }
        });
    }

    private _loadSettings(): void {
        this._flavours = this._selectedCloudClient ? this._allFlavours.filter(flavour => flavour.cloudId == this._selectedCloudClient.id) : [];

        if (this._selectedCloudClient) {
            this._apollo.query<any>({
                query: gql`
                    query bookingSettings($cloudClientId: Int!) {
                        bookingConfigurationForCloudClient(cloudClientId: $cloudClientId) {
                            enabled
                            maxInstancesPerReservation
                            maxDaysInAdvance
                            maxDaysReservation
                            cloudId
                            flavours {
                                id
                                name
                            }
                            roles {
                                id
                                name
                            }
                            flavourRoleConfigurations {
                                flavour {
                                    id
                                    name
                                }
                                role {
                                    id
                                    name
                                }
                                maxInstancesPerReservation
                                maxDaysReservation
                            }
                        }
                    }
            `,
                variables: {
                    cloudClientId: this._selectedCloudClient.id,
                }
            }).pipe(
                takeUntil(this._destroy$),
                map(({data}) => data),
                tap(() => this._loading = false)
            ).subscribe(({bookingConfigurationForCloudClient}) => {
                this._resetForm(bookingConfigurationForCloudClient);
            });

        } else {
            this._resetForm(null);
        }
    }

    private _resetForm(bookingConfiguration: BookingConfiguration) {
        bookingConfiguration = {
            enabled: false,
            maxInstancesPerReservation: null,
            maxDaysInAdvance: null,
            maxDaysReservation: null,
            roles: [],
            flavours: [],
            flavourRoleConfigurations: [],
            ...bookingConfiguration,
        }

        const flavoursSettings = bookingConfiguration.flavourRoleConfigurations.reduce((acc: FormGroup[], current: BookingFlavourRoleConfiguration) => {
            const {flavour, role, maxInstancesPerReservation, maxDaysReservation} = current;

            let flavourSettingsGroup = acc.find(formGroup => formGroup.value.flavour.id === flavour.id);
            if (flavourSettingsGroup == null) {
                flavourSettingsGroup = this._createFlavourSettingsGroup(flavour, role, maxInstancesPerReservation, maxDaysReservation);
                acc.push(flavourSettingsGroup);

            } else {
                const rolesArray = flavourSettingsGroup.get('roles') as FormArray;
                rolesArray.push(this._createFlavourRoleSettingsGroup(role == null ? this._allUserRole : role, maxInstancesPerReservation, maxDaysReservation));
            }
            return acc;

        }, []);

        this._form.reset({
            enabled: bookingConfiguration.enabled,
            maxInstancesPerReservation: bookingConfiguration.maxInstancesPerReservation,
            maxDaysInAdvance: bookingConfiguration.maxDaysInAdvance,
            maxDaysReservation: bookingConfiguration.maxDaysReservation,
            roles: bookingConfiguration.roles,
            flavours: bookingConfiguration.flavours,
            flavoursSettings: this._formBuilder.array([], (control) => this._flavoursValidator(control)),
        });
        this.flavoursFormArray.clear();

        flavoursSettings.forEach(flavourSetting => {
            this.flavoursFormArray.push(flavourSetting);
        });

        this._updateRolesForFlavourConfig();
        this._updateFlavoursForConfig();

    }

    private _createFlavourSettingsGroup(flavour?: Flavour, role?: Role, maxInstancesPerReservation?: number, maxDaysReservation?: number): FormGroup {
        return this._formBuilder.group({
            flavour: [flavour, [Validators.required, (control) => this._flavourRoleConfigFlavourValidator(control)]],
            roles: this._formBuilder.array([this._createFlavourRoleSettingsGroup(role, maxInstancesPerReservation, maxDaysReservation)], (control) => this._flavourRolesValidator(control)),
        });
    }

    private _createFlavourRoleSettingsGroup(role?: Role, maxInstancesPerReservation?: number, maxDaysReservation?: number): FormGroup {
        return this._formBuilder.group({
            role: [role, [Validators.required, (control) => this._flavourRoleConfigRoleValidator(control)]],
            maxInstancesPerReservation: [maxInstancesPerReservation],
            maxDaysReservation: [maxDaysReservation],
        });
    }

    private _updateRolesForFlavourConfig(): void {
        const selectedRoles = this._form.get('roles').value || [] as Role[];
        if (selectedRoles.length == 0) {
            this._rolesForFlavourConfig = [null, this._allUserRole, ...this._roles];
        } else {
            this._rolesForFlavourConfig = [null, ...selectedRoles];
        }
    }

    private _updateFlavoursForConfig(): void {
        const selectedFlavours = this._form.get('flavours').value || [] as Flavour[];
        if (selectedFlavours.length == 0) {
            this._flavoursForConfig = [null, ...this._flavours];
        } else {
            this._flavoursForConfig = [null, ...selectedFlavours];
        }
    }

    private _flavourRoleConfigFlavourValidator(control: AbstractControl): ValidationErrors | null {
        const flavour = control.value as Flavour;
        if (flavour == null) {
            return {flavourIsNull: true};
        }
        return this._flavoursForConfig.filter(flavour => !!flavour).map(flavour => flavour.id).includes(flavour?.id) ? null : {flavourUnavailable: true};
    }

    private _flavourRoleConfigRoleValidator(control: AbstractControl): ValidationErrors | null {
        const role = control.value as Role;
        if (role == null) {
            return {roleIsNull: true};
        }
        return this._rolesForFlavourConfig.filter(role => !!role).map(role => role.id).includes(role?.id) ? null : {roleUnavailable: true};
    }

    private _flavoursValidator(control: AbstractControl): ValidationErrors | null {
        const array = control as FormArray;

        const flavourIds = array.controls.map(control => control.get('flavour')?.value)
            .filter(flavour => !!flavour)
            .map(flavour => flavour.id);
        const hasDuplicates = new Set(flavourIds).size !== flavourIds.length;
        return hasDuplicates ? {duplicatedFlavours: true} : null;
    }

    private _flavourRolesValidator(control: AbstractControl): ValidationErrors | null {
        const array = control as FormArray;

        const roleIds = array.controls.map(control => control.get('role')?.value)
            .filter(role => !!role)
            .map(role => role.id);
        const hasDuplicates = new Set(roleIds).size !== roleIds.length;
        return hasDuplicates ? {duplicatedRoles: true} : null;
    }

    private _revalidateForm(control: AbstractControl): void {
        control.updateValueAndValidity({ onlySelf: true, emitEvent: true });
        control.markAsTouched({ onlySelf: true });

        if (control instanceof FormGroup) {
            Object.values(control.controls).forEach(c => this._revalidateForm(c));
        }

        if (control instanceof FormArray) {
            control.controls.forEach(c => this._revalidateForm(c));
        }
    }

}
