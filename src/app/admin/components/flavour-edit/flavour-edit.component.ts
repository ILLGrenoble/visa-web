import {Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewEncapsulation} from '@angular/core';
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
import {map, takeUntil} from 'rxjs/operators';
import { durationValidator } from './duration.validator';
import {formatDuration, parseDurationString} from "../../common";
import {NotifierService} from "angular-notifier";

@Component({
    selector: 'visa-admin-flavour-edit',
    templateUrl: './flavour-edit.component.html',
    styleUrls: ['./flavour-edit.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class FlavourEditComponent implements OnInit, OnDestroy {

    private _form: FormGroup;
    private _cloudClients: CloudClient[];
    private _cloudFlavours: CloudFlavour[];
    private _instruments: Instrument[];
    private _roles: Role[];
    private _lifetimeRoles: Role[];
    private _title: string;
    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _multiCloudEnabled = false;

    private _flavourId: number;
    private _modalData$: Subject<{flavour: Flavour, clone: boolean}>;
    private _showEditModal = false;
    private _onSave$: EventEmitter<void> = new EventEmitter<void>();

    private readonly _defaultRole: Role = {name: 'DEFAULT (all users)', id: null, description: 'Default role', expiresAt: null};

    get showEditModal(): boolean {
        return this._showEditModal;
    }

    set showEditModal(value: boolean) {
        this._showEditModal = value;
    }

    @Input()
    set modalData$(value: Subject<{ flavour: Flavour; clone: boolean }>) {
        this._modalData$ = value;
    }

    @Output()
    get onSave(): EventEmitter<void> {
        return this._onSave$;
    }

    get roles(): Role[] {
        return this._roles;
    }

    @Input()
    set roles(roles: Role[]) {
        this._roles = roles;
        this._lifetimeRoles = roles == null ? [] : [this._defaultRole, ...roles]
    }

    get instruments(): Instrument[] {
        return this._instruments;
    }

    @Input()
    set instruments(value: Instrument[]) {
        this._instruments = value;
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

    get title(): string {
        return this._title;
    }

    get multiCloudEnabled(): boolean {
        return this._multiCloudEnabled;
    }

    constructor(private readonly _apollo: Apollo,
                private readonly _formBuilder: FormBuilder,
                private readonly _notifierService: NotifierService) {

        this._form = this._formBuilder.group({
            name: [null, Validators.required],
            cloudClient: [null, Validators.required],
            cloudFlavour: [null, Validators.required],
            instruments: [null],
            roles: [null],
            roleLifetimes: this._formBuilder.array([]),
        });
    }

    public ngOnInit(): void {
        this._modalData$.pipe(
            takeUntil(this._destroy$),
        ).subscribe(data => {
            const {flavour, clone} = data;
            if (flavour) {
                if (clone) {
                    this._title = `Clone flavour`;
                    this._flavourId = null;

                } else {
                    this._title = `Edit flavour`;
                    this._flavourId = flavour.id;
                }
                this._createFormFromFlavour(flavour, clone);

            } else {
                this._title = `Create flavour`;
                this._flavourId = null;

                this._resetForm();
            }
            this._showEditModal = true;
        });

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

    private _resetForm(): void {
        this.form.reset({
            name: null,
            cloudClient: this._cloudClients[0],
            cloudFlavour: null,
        });

        this.roleLifetimes.clear();
    }

    private _createFormFromFlavour(flavour: Flavour, clone: boolean): void {
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

        this.roleLifetimes.clear();
        roleLifetimes.forEach(roleLifetime =>
            this.roleLifetimes.push(this._createRoleLifetimeGroup(clone ? null : roleLifetime.id, roleLifetime.role == null ? this._defaultRole : roleLifetime.role, roleLifetime.lifetimeMinutes))
        );

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
        this._showEditModal = false;
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
        this._saveFlavour(input);
    }

    private _saveFlavour(input: FlavourInput) {
        if (this._flavourId != null) {
            this._apollo.mutate<any>({
                mutation: gql`
                    mutation UpdateFlavour($id: Int!, $input: FlavourInput!){
                        updateFlavour(id: $id, input: $input) {
                            id
                        }
                    }
                    `,
                variables: {id: this._flavourId, input},
            }).pipe(
                takeUntil(this._destroy$)
            ).subscribe({
                next: () => {
                    this._notifierService.notify('success', 'Flavour saved');
                    this._showEditModal = false;
                    this._onSave$.next();
                },
                error: (error) => {
                    this._notifierService.notify('error', error);
                }
            });
        } else {
            this._apollo.mutate<any>({
                mutation: gql`
                        mutation CreateFlavour($input: FlavourInput!){
                            createFlavour(input: $input) {
                                id
                                name
                                memory
                                cpu
                                computeId
                            }
                        }
                    `,
                variables: {input},
            }).pipe(
                takeUntil(this._destroy$),
            ).subscribe({
                next: () => {
                    this._notifierService.notify('success', 'Flavour created');
                    this._showEditModal = false;
                    this._onSave$.next();
                },
                error: (error) => {
                    this._notifierService.notify('error', error);
                }
            });
        }
    }
}
