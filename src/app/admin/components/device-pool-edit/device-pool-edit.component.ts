import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {
    CloudClient,
    CloudDevice,
    DevicePoolInput,
    DevicePool,
    Hypervisor,
} from '../../../core/graphql';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {Apollo} from 'apollo-angular';
import gql from 'graphql-tag';
import {map, takeUntil} from 'rxjs/operators';
import {NotifierService} from "angular-notifier";

type ResourceClass = {name: string, total: number, title: string, placeholder: string};

@Component({
    selector: 'visa-admin-device-pool-edit',
    templateUrl: './device-pool-edit.component.html',
    styleUrls: ['./device-pool-edit.component.scss'],
})
export class DevicePoolEditComponent implements OnInit, OnDestroy {

    private _form: FormGroup;
    private _cloudClients: CloudClient[];
    private _cloudDevices: CloudDevice[];
    private _allHypervisors: Hypervisor[];
    private _hypervisors: Hypervisor[];
    private _configuredDevicePools: DevicePool[];
    private _customResourceClasses: ResourceClass[];
    private _title: string;
    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _multiCloudEnabled = false;
    private _placementAvailable = false;
    private _loadingCloudDevices = true;

    private _devicePoolId: number;
    private _modalData$: Subject<{devicePool: DevicePool, clone: boolean}>;
    private _showEditModal = false;
    private _onSave$: EventEmitter<void> = new EventEmitter<void>();

    get showEditModal(): boolean {
        return this._showEditModal;
    }

    set showEditModal(value: boolean) {
        this._showEditModal = value;
    }

    @Input()
    set modalData$(value: Subject<{ devicePool: DevicePool; clone: boolean }>) {
        this._modalData$ = value;
    }

    @Input()
    set configuredDevicePools(value: DevicePool[]) {
        this._configuredDevicePools = value || [];
    }

    @Input()
    set allHypervisors(value: Hypervisor[]) {
        this._allHypervisors = value || [];
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

    get cloudClients(): CloudClient[] {
        return this._cloudClients;
    }

    get cloudDevices(): CloudDevice[] {
        return this._cloudDevices;
    }

    get customResourceClasses(): ResourceClass[] {
        return this._customResourceClasses;
    }

    get title(): string {
        return this._title;
    }

    get multiCloudEnabled(): boolean {
        return this._multiCloudEnabled;
    }

    get placementAvailable(): boolean {
        return this._placementAvailable;
    }

    get loadingCloudDevices(): boolean {
        return this._loadingCloudDevices;
    }

    get selectedResourceClass(): ResourceClass {
        return this._form.get('resourceClass').value;
    }

    constructor(private readonly _apollo: Apollo,
                private readonly _notifierService: NotifierService) {
        this._form = new FormGroup({
            name: new FormControl(null, Validators.required),
            description: new FormControl(null),
            totalUnits: new FormControl(null),
            cloudDevice: new FormControl(null, Validators.required),
            resourceClass: new FormControl(null),
            cloudClient: new FormControl(null, Validators.required),
        });
    }

    public ngOnInit(): void {
        this._modalData$.pipe(
            takeUntil(this._destroy$),
        ).subscribe(data => {
            const {devicePool, clone} = data;

            if (devicePool) {
                if (clone) {
                    this._title = `Clone device pool`;
                    this._devicePoolId = null;

                } else {
                    this._title = `Edit device pool`;
                    this._devicePoolId = devicePool.id;
                }
                this._createFormFromDevicePool(devicePool);

            } else {
                this._title = `Create device pool`;
                this._devicePoolId = null;

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

            if (this._form.get('cloudClient').value == null) {
                this.form.controls.cloudClient.reset(this._cloudClients[0]);
                this._loadCloudDevices(this._cloudClients[0].id);

            } else {
                this._loadCloudDevices(this._form.value.cloudClient.id, this._form.value.cloudDevice);
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

    public compareCloudDevice(cloudDevice1: CloudDevice, cloudDevice2: CloudDevice): boolean {
        if (cloudDevice1 == null || cloudDevice2 == null) {
            return false;
        }
        return cloudDevice1.identifier === cloudDevice2.identifier && cloudDevice1.type === cloudDevice2.type;
    }

    public compareResourceClass(resourceClass1: ResourceClass, resourceClass2: ResourceClass): boolean {
        if (resourceClass1 == null || resourceClass2 == null) {
            return false;
        }
        return resourceClass1.name === resourceClass2.name;
    }

    private _resetForm(): void {
        this.form.reset({
            name: null,
            description: null,
            totalUnits: null,
            cloudDevice: null,
            resourceClass: null,
            cloudClient: null,
        });

        const cloudClient = this._cloudClients[0];
        this.form.controls.cloudClient.reset(cloudClient);
        this._loadCloudDevices(cloudClient.id);
        this._hypervisors = this._allHypervisors.filter(hypervisor => hypervisor.cloudId === cloudClient.id);
    }

    private _createFormFromDevicePool(devicePool: DevicePool): void {
        const { name, description, totalUnits, cloudDevice, resourceClass, cloudClient } = devicePool;
        this.form.reset({ name, description, totalUnits, cloudDevice, cloudClient });

        // Initialise cloud devices with current cloud device
        this._cloudDevices = [null, cloudDevice];
        this._loadCloudDevices(cloudClient.id, this._form.value.cloudDevice);

        this._hypervisors = this._allHypervisors.filter(hypervisor => hypervisor.cloudId === cloudClient.id);

        if (resourceClass != null) {
            const total = this.getTotalForResourceClass(resourceClass);
            const resource = {name: resourceClass, total, title: `${resourceClass} (${total} units)`, placeholder: `${total} units`};
            this.form.controls.resourceClass.reset(resource);
            this._customResourceClasses = [null, resource];
        }
    }

    public onCloudChange(): void {
        this._loadCloudDevices(this._form.value.cloudClient.id);
        this.form.controls.cloudDevice.reset();
    }

    private _loadCloudDevices(cloudId: number, selectedCloudDevice?: CloudDevice): void {
        this._loadingCloudDevices = true;
        this._hypervisors = this._allHypervisors.filter(hypervisor => hypervisor.cloudId === cloudId);

        this._apollo.query<any>({
            query: gql`
                query cloudDevices($cloudId: Int!) {
                    cloudDevices(cloudId: $cloudId) {
                        identifier
                        type
                    }
                    cloudResourceClasses(cloudId: $cloudId) {
                        resourceClasses
                        available
                    }
                }
            `,
            variables: { cloudId },
        }).pipe(
            map(({data}) => data),
        ).subscribe(data => {
            this._loadingCloudDevices = false;

            let cloudDevices = data?.cloudDevices || [];
            const cloudResourceClasses = data?.cloudResourceClasses || {resourceClasses: [], available: false};
            this._placementAvailable = cloudResourceClasses.available;
            if (!cloudResourceClasses.available) {
                this._form.get('resourceClass').disable();
            } else {
                this._form.get('resourceClass').enable();
            }
            const allResourceClasses = cloudResourceClasses.resourceClasses as string[];
            const customResources = allResourceClasses ? allResourceClasses.filter(name => !['VCPU', 'MEMORY_MB', 'DISK_GB'].includes(name)) : [];
            this._customResourceClasses = [null, ...customResources.map(name => {
                const total = this.getTotalForResourceClass(name);
                return {name, total, title: `${name} (${total} units)`, placeholder: `${total} units`};
            })];

            // Filter out configured devices
            cloudDevices = cloudDevices.filter(cloudDevice => {
                return this._configuredDevicePools
                    .filter(configuredDevicePool => configuredDevicePool.cloudClient.id == cloudId)
                    .filter(configuredDevicePool => configuredDevicePool.id != this._devicePoolId)
                    .map(configuredDevicePool => configuredDevicePool.cloudDevice)
                    .find(configuredCloudDevice => configuredCloudDevice.type === cloudDevice.type && configuredCloudDevice.identifier === cloudDevice.identifier) == null;
            });

            if (cloudDevices.length > 0) {
                cloudDevices.unshift(null);
            }
            this._cloudDevices = cloudDevices;
            this.form.controls.cloudDevice.reset(selectedCloudDevice);
        });
    }

    private getTotalForResourceClass(name: string) {
        return this._hypervisors
            .flatMap(hypervisor => hypervisor.resources)
            .filter(resource => resource.resourceClass === name)
            .reduce(((previousSum, resourceClass) => previousSum + resourceClass.total), 0);
    }

    public onCancel(): void {
        this._showEditModal = false;
    }

    public submit(): void {
        const {name, description, totalUnits, cloudClient, cloudDevice, resourceClass} = this.form.value;
        const input = {
            name,
            description,
            totalUnits: totalUnits === '' ? null : totalUnits,
            resourceClass: resourceClass ? resourceClass.name : null,
            cloudId: cloudClient.id,
            computeIdentifier: cloudDevice.identifier,
            deviceType: cloudDevice.type,
        } as DevicePoolInput;
        this._saveDevicePool(input);
    }

    private _saveDevicePool(input: DevicePoolInput): void {
        if (this._devicePoolId != null) {
            this._apollo.mutate<any>({
                mutation: gql`
                        mutation updateDevicePool($id: Int!, $input: DevicePoolInput!){
                            updateDevicePool(id: $id, input: $input) {
                                id
                            }
                        }
                        `,
                variables: {id: this._devicePoolId, input},
            }).pipe(
                takeUntil(this._destroy$)
            ).subscribe({
                next: () => {
                    this._notifierService.notify('success', 'Device Pool saved');
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
                            mutation createDevicePool($input: DevicePoolInput!){
                                createDevicePool(input: $input) {
                                    id
                                    name
                                    description
                                    computeIdentifier
                                    deviceType
                                }
                            }
                        `,
                variables: {input},
            }).pipe(
                takeUntil(this._destroy$),
            ).subscribe({
                next: () => {
                    this._notifierService.notify('success', 'Device Pool created');
                    this._showEditModal = false;
                    this._onSave$.next();
                },
                error: (error) => {
                    this._notifierService.notify('error', error);
                }
            });

        }

    }
    protected placementConfigMessage(): string {
        if (this._form.get('cloudClient').value.type === 'openstack') {
            return 'You need to specify the Placement Endpoint for the OpenStack Cloud Provider'
        } else {
            return 'The Web Cloud Provider does not currently provide resource classes'
        }
    }

    protected resourceClassConfigMessage(): string {
        if (this._form.get('cloudClient').value.type === 'openstack') {
            return 'Verify that pci_in_placement is set in the OpenStack nova.conf configuration file'
        } else {
            return 'The Web Cloud Provider does not return any custom resource classes'
        }
    }

}
