import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {CloudClient, CloudDevice, DevicePoolInput, DevicePool, Hypervisor} from '../../../core/graphql';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {Apollo} from 'apollo-angular';
import gql from 'graphql-tag';
import {filter, map, takeUntil} from 'rxjs/operators';

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
    private readonly _title: string;
    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _onSave$: Subject<DevicePoolInput> = new Subject<DevicePoolInput>();
    private _multiCloudEnabled = false;
    private _placementAvailable = false;
    private _loadingCloudDevices = true;

    constructor(private readonly _dialogRef: MatDialogRef<DevicePoolEditComponent>,
                private readonly _apollo: Apollo,
                @Inject(MAT_DIALOG_DATA) {devicePool, clone, configuredDevicePools, hypervisors}) {

        this._configuredDevicePools = configuredDevicePools || [];
        this._allHypervisors = hypervisors || [];

        this._dialogRef.keydownEvents().pipe(filter(event => event.key === 'Escape')).subscribe(() => this._dialogRef.close());
        this._dialogRef.backdropClick().subscribe(() => this._dialogRef.close());

        this._form = new FormGroup({
            name: new FormControl(null, Validators.required),
            description: new FormControl(null),
            totalUnits: new FormControl(null),
            cloudDevice: new FormControl(null, Validators.required),
            resourceClass: new FormControl(null),
            cloudClient: new FormControl(null, Validators.required),
        });

        if (devicePool) {
            if (clone) {
                this._title = `Clone device pool`;
            } else {
                this._title = `Edit device pool`;
                this._configuredDevicePools = this._configuredDevicePools.filter(configuredDevicePool => configuredDevicePool.id != devicePool.id)
            }
            this._createFormFromDevicePool(devicePool);
        } else {
            this._title = `Create device pool`;
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

    get cloudDevices(): CloudDevice[] {
        return this._cloudDevices;
    }

    get customResourceClasses(): ResourceClass[] {
        return this._customResourceClasses;
    }

    get onSave$(): Subject<DevicePoolInput> {
        return this._onSave$;
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

    private _createFormFromDevicePool(devicePool: DevicePool): void {
        const { name, description, totalUnits, cloudDevice, resourceClass, cloudClient } = devicePool;
        this.form.reset({ name, description, totalUnits, cloudDevice, cloudClient });

        // Initialise cloud devices with current cloud device
        this._cloudDevices = [null, cloudDevice];

        this._hypervisors = this._allHypervisors.filter(hypervisor => hypervisor.cloudClientId === cloudClient.id);

        if (resourceClass != null) {
            const total = this.getTotalForResourceClass(resourceClass);
            const resource = {name: resourceClass, total, title: `${resourceClass} (${total} units)`, placeholder: `${total} units`};
            this.form.controls.resourceClass.reset(resource);
            this._customResourceClasses = [null, resource];
        }
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

    public onCloudChange(): void {
        this._loadCloudDevices(this._form.value.cloudClient.id);
        this.form.controls.cloudDevice.reset();
    }

    private _loadCloudDevices(cloudId: number, selectedCloudDevice?: CloudDevice): void {
        this._loadingCloudDevices = true;
        this._hypervisors = this._allHypervisors.filter(hypervisor => hypervisor.cloudClientId === cloudId);

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

            let cloudDevices = data.cloudDevices || [];
            const cloudResourceClasses = data.cloudResourceClasses;
            this._placementAvailable = cloudResourceClasses.available;
            if (!cloudResourceClasses.available) {
                this._form.get('resourceClass').disable();
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
        this._dialogRef.close();
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
        this._onSave$.next(input);
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
