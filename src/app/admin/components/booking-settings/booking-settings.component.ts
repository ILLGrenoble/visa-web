import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {BehaviorSubject, Subject} from 'rxjs';
import {Apollo} from 'apollo-angular';
import {NotifierService} from 'angular-notifier';
import {Title} from '@angular/platform-browser';
import {FormArray, FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {Role, Flavour, DevicePoolInput, CloudClient} from "../../../core/graphql";
import gql from "graphql-tag";
import {delay, map, takeUntil, tap} from "rxjs/operators";
import {id} from "@cds/core/internal";


@Component({
    selector: 'visa-admin-booking-settings',
    templateUrl: './booking-settings.component.html',
    styleUrls: ['./booking-settings.component.scss'],
})
export class BookingSettingsComponent implements OnInit, OnDestroy {

    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _loading: boolean;

    private _form: FormGroup = new FormGroup({
        enabled: new FormControl(true, Validators.required),
        maxInstances: new FormControl(null),
        maxDaysInAdvance: new FormControl(null),
        maxDaysReservation: new FormControl(null),
        roles: new FormControl([]),
        flavours: new FormControl([]),
        flavoursSettings: this._formBuilder.array([]),
    });

    private _roles: Role[];
    private _allFlavours: Flavour[];
    private _flavours: Flavour[];
    private _cloudClients: CloudClient[] = [];
    private _multiCloudEnabled = false;
    private _previousSelectedCloudClient: CloudClient;
    private _selectedCloudClient: CloudClient;
    private _showSaveBeforeCloudClientChangeModal = false;

    constructor(private readonly _apollo: Apollo,
                private readonly _notifierService: NotifierService,
                private readonly _dialog: MatDialog,
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

    get flavours(): Flavour[] {
        return this._flavours;
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
            this._cloudClients = cloudClients;
            this._multiCloudEnabled = cloudClients.length > 1;

            if (this._form.value.cloudClient == null) {
                this._selectedCloudClient = cloudClients[0];
            }
            this._loadSettings();
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
    }

    protected compareCloudClient(cloudClient1: CloudClient, cloudClient2: CloudClient): boolean {
        if (cloudClient1 == null || cloudClient2 == null) {
            return false;
        }
        return cloudClient1.id === cloudClient2.id;
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
        const {enabled, maxInstances, maxDaysInAdvance, maxDaysReservation, roles, flavours, flavoursSettings} = this._form.value;

        const flavourRoleSettings = flavoursSettings.flatMap(flavourSettings => {
            const {flavour, roles} = flavourSettings;
            return roles.map(roleSettings => {
                const {id, role, maxInstances, maxDaysReservation} = roleSettings;
                return {id, flavourId: flavour.id, roleId: role.id, maxInstances, maxDaysReservation};
            })
        });

        const data = {
            cloudId: this._selectedCloudClient.id,
            enabled,
            maxInstances,
            maxDaysInAdvance,
            maxDaysReservation,
            roleIds: roles.map(role => role.id),
            flavourIds: flavours.map(flavour => flavour.id),
            flavourRoleSettings
        }
    }

    private _loadSettings(): void {
        this._flavours = this._selectedCloudClient ? this._allFlavours.filter(flavour => flavour.cloudId == this._selectedCloudClient.id) : [];

        if (this._selectedCloudClient) {
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
                this._form.reset({
                    enabled: true,
                    maxInstances: null,
                    maxDaysInAdvance: null,
                    maxDaysReservation: null,
                    roles: [],
                    flavours: [],
                    flavoursSettings: this._formBuilder.array([]),
                });

            });

        } else {
            this._form.reset({
                enabled: true,
                maxInstances: null,
                maxDaysInAdvance: null,
                maxDaysReservation: null,
                roles: [],
                flavours: [],
                flavoursSettings: this._formBuilder.array([]),
            });
        }
    }

    private _createFlavourSettingsGroup(flavour?: Flavour): FormGroup {
        return this._formBuilder.group({
            flavour: [flavour, [Validators.required]],
            roles: this._formBuilder.array([this._createFlavourRoleSettingsGroup()]),
        });
    }

    private _createFlavourRoleSettingsGroup(id?: number, role?: Role): FormGroup {
        return this._formBuilder.group({
            id: [id],
            role: [role, [Validators.required]],
            maxInstances: [],
            maxDaysReservation: [],
        });
    }


}
