import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {
    CloudFlavour,
    Flavour,
    Instrument,
    FlavourInput,
    CloudClient,
    Role, CloudDeviceAllocation
} from '../../../core/graphql';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {Apollo} from 'apollo-angular';
import gql from 'graphql-tag';
import {filter, map, takeUntil} from 'rxjs/operators';
import { durationValidator } from './duration.validator';
import {formatDuration, parseDurationString} from "../../common";
@Component({
    selector: 'visa-admin-flavour-edit',
    templateUrl: './flavour-edit.component.html',
    styleUrls: ['./flavour-edit.component.scss'],
})
export class FlavourEditComponent implements OnInit, OnDestroy {

    private _form: FormGroup;
    private _cloudClients: CloudClient[];
    private _cloudFlavours: CloudFlavour[];
    private readonly _instruments: Instrument[];
    private readonly _roles: Role[];
    private readonly _lifetimeRoles: Role[];
    private readonly _title: string;
    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _onSave$: Subject<FlavourInput> = new Subject<FlavourInput>();
    private _multiCloudEnabled = false;

    private readonly _defaultRole: Role = {name: 'DEFAULT (all users)', id: null, description: 'Default role', expiresAt: null};

    constructor(private readonly _dialogRef: MatDialogRef<FlavourEditComponent>,
                private readonly _apollo: Apollo,
                private readonly _formBuilder: FormBuilder,
                @Inject(MAT_DIALOG_DATA) {flavour, instruments, roles, clone}) {

        this._instruments = instruments;
        this._roles = roles;
        this._lifetimeRoles = [this._defaultRole, ...roles]

        this._dialogRef.keydownEvents().pipe(filter(event => event.key === 'Escape')).subscribe(() => this._dialogRef.close());
        this._dialogRef.backdropClick().subscribe(() => this._dialogRef.close());

        this._form = this._formBuilder.group({
            name: [null, Validators.required],
            cloudClient: [null, Validators.required],
            cloudFlavour: [null, Validators.required],
            instruments: [null],
            roles: [null],
            roleLifetimes: this._formBuilder.array([]),
        });

        if (flavour) {
            if (clone) {
                this._title = `Clone flavour`;
            } else {
                this._title = `Edit flavour`;
            }
            this._createFormFromFlavour(flavour);
        } else {
            this._title = `Create flavour`;
        }
    }

    get form(): FormGroup {
        return this._form;
    }

    set form(value: FormGroup) {
        this._form = value;
    }

    get cloudClients(): CloudClient[] {
        return this._cloudClients;
    }

    get cloudFlavours(): CloudFlavour[] {
        return this._cloudFlavours;
    }

    get instruments(): Instrument[] {
        return this._instruments;
    }

    get roles(): Role[] {
        return this._roles;
    }

    get availableRuleRoles(): Role[] {
        return this._lifetimeRoles.filter(role => !this._form.value.roleLifetimes.map(roleLifetime => roleLifetime.role?.id).includes(role.id));
    }

    get memory(): number {
        return this._form.value.cloudFlavour ? this._form.value.cloudFlavour.ram / 1024 : 0;
    }

    get cpu(): number {
        return this._form.value.cloudFlavour ? this._form.value.cloudFlavour.cpus : 0;
    }

    get deviceAllocations(): CloudDeviceAllocation[] {
        return this._form.value.cloudFlavour ? this._form.value.cloudFlavour.deviceAllocations : [];
    }

    get roleLifetimes(): FormArray {
        return this._form.get('roleLifetimes') as FormArray;
    }

    get onSave$(): Subject<FlavourInput> {
        return this._onSave$;
    }

    get title(): string {
        return this._title;
    }

    get multiCloudEnabled(): boolean {
        return this._multiCloudEnabled;
    }

    public compareCloudClient(cloudClient1: CloudClient, cloudClient2: CloudClient): boolean {
        if (cloudClient1 == null || cloudClient2 == null) {
            return false;
        }
        return cloudClient1.id === cloudClient2.id;
    }

    public compareCloudFlavour(cloudFlavour1: CloudFlavour, cloudFlavour2: CloudFlavour): boolean {
        if (cloudFlavour1 == null || cloudFlavour2 == null) {
            return false;
        }
        return cloudFlavour1.id === cloudFlavour2.id;
    }


    public addRoleLifetime() {
        this.roleLifetimes.push(this._createRoleLifetimeGroup());
    }

    public removeRoleLifetime(index: number) {
        this.roleLifetimes.removeAt(index);
    }

    private _createFormFromFlavour(flavour: Flavour): void {
        const {
            name,
            cloudClient,
            cloudFlavour,
            roleLifetimes,
        } = flavour;
        this.form.reset({
            name,
            cloudClient,
            cloudFlavour,
        });

        roleLifetimes.forEach(roleLifetime =>
            this.roleLifetimes.push(this._createRoleLifetimeGroup(roleLifetime.id, roleLifetime.role == null ? this._defaultRole : roleLifetime.role, roleLifetime.lifetimeMinutes))
        );

        // Initialise cloud flavours with current cloud flavour
        this._cloudFlavours = [null, cloudFlavour];

        this._apollo.query<any>({
            query: gql`
                query {
                    flavourLimits  {
                        id
                        objectId
                        objectType
                        flavour {
                          id
                        }
                    }
                }
            `
        }).pipe(
            map(({data}) => ({
                    flavourLimits: data.flavourLimits,
                })
            ),
            takeUntil(this._destroy$)
        ).subscribe(({flavourLimits}) => {

            const flavourInstrumentIds = flavourLimits
                .filter(limit => limit.flavour.id === flavour.id)
                .filter(limit => limit.objectType === 'INSTRUMENT')
                .map(limit => limit.objectId);

            const flavourRoleIds = flavourLimits
                .filter(limit => limit.flavour.id === flavour.id)
                .filter(limit => limit.objectType === 'ROLE')
                .map(limit => limit.objectId);

            const selectedInstruments = this._instruments.filter(instrument => (flavourInstrumentIds.includes(instrument.id)));
            const selectedRoles = this._roles.filter(role => (flavourRoleIds.includes(role.id)));
            this.form.controls.instruments.reset(selectedInstruments);
            this.form.controls.roles.reset(selectedRoles);
        });
    }

    private _createRoleLifetimeGroup(id?: number, role?: Role, lifetime?: number): FormGroup {
        return this._formBuilder.group({
            id: [id],
            role: [role],
            lifetimeText: [lifetime ? formatDuration(lifetime) : '', [Validators.required, durationValidator]]
        });
    }

    public ngOnInit(): void {
        this._apollo.query<any>({
            query: gql`
                query {
                    cloudClients {
                        id
                        name
                    }
                }
            `
        }).pipe(
            map(({data}) => ({
                    cloudClients: data.cloudClients,
                })
            ),
            takeUntil(this._destroy$)
        ).subscribe(({cloudClients}) => {
            this._cloudClients = cloudClients;
            this._multiCloudEnabled = cloudClients.length > 1;

            if (this._form.value.cloudClient == null) {
                this.form.controls.cloudClient.reset(this._cloudClients[0]);
                this._loadCloudFlavours(this._cloudClients[0].id);

            } else {
                this._loadCloudFlavours(this._form.value.cloudClient.id, this._form.value.cloudFlavour);
            }
        });
    }

    ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    public onCloudChange(): void {
        this._loadCloudFlavours(this._form.value.cloudClient.id);
        this.form.controls.cloudFlavour.reset();
    }

    private _loadCloudFlavours(cloudId: number, selectedCloudFlavour?: CloudFlavour): void {

        this._apollo.query<any>({
            query: gql`
                query cloudFlavours($cloudId: Int!) {
                    cloudFlavours(cloudId: $cloudId) {
                        id
                        name
                        cpus
                        ram
                        deviceAllocations {
                            device {
                                identifier
                                type
                            }
                            unitCount
                        }
                    }
                }
            `,
            variables: { cloudId },
        }).pipe(
            map(({data}) => (data.cloudFlavours)),
        ).subscribe((cloudFlavours) => {
            cloudFlavours = cloudFlavours || [];
            cloudFlavours.unshift(null);
            this._cloudFlavours = cloudFlavours;
            this.form.controls.cloudFlavour.reset(selectedCloudFlavour);
        });
    }

    public onCancel(): void {
        this._dialogRef.close();
    }

    public submit(): void {
        const {name, cloudClient, cloudFlavour, instruments, roles, roleLifetimes} = this.form.value;
        const input = {
            name,
            cloudId: cloudClient.id,
            computeId: cloudFlavour.id,
            instrumentIds: instruments ? instruments.map(instrument => instrument.id) : [],
            roleIds: roles ? roles.map(role => role.id) : [],
            memory: cloudFlavour.ram,
            cpu: cloudFlavour.cpus,
            roleLifetimes: roleLifetimes ? roleLifetimes.map(rl => {
                const {id, role, lifetimeText} = rl;
                return { id, roleId: role?.id, lifetimeMinutes: parseDurationString(lifetimeText) };
            }) : []
        } as FlavourInput;
        this._onSave$.next(input);
    }
}
