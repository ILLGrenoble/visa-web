import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import { CloudClient, CloudDevice, DevicePoolInput, DevicePool } from '../../../core/graphql';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {Apollo} from 'apollo-angular';
import gql from 'graphql-tag';
import {filter, map, takeUntil} from 'rxjs/operators';

@Component({
    selector: 'visa-admin-device-pool-edit',
    templateUrl: './device-pool-edit.component.html',
    styleUrls: ['./device-pool-edit.component.scss'],
})
export class DevicePoolEditComponent implements OnInit, OnDestroy {

    private _form: FormGroup;
    private _cloudClients: CloudClient[];
    private _cloudDevices: CloudDevice[];
    private _configuredDevicePools: DevicePool[];
    private readonly _title: string;
    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _onSave$: Subject<DevicePoolInput> = new Subject<DevicePoolInput>();
    private _multiCloudEnabled = false;

    constructor(private readonly _dialogRef: MatDialogRef<DevicePoolEditComponent>,
                private readonly _apollo: Apollo,
                @Inject(MAT_DIALOG_DATA) {devicePool, clone, configuredDevicePools}) {

        this._configuredDevicePools = configuredDevicePools || [];

        this._dialogRef.keydownEvents().pipe(filter(event => event.key === 'Escape')).subscribe(() => this._dialogRef.close());
        this._dialogRef.backdropClick().subscribe(() => this._dialogRef.close());

        this._form = new FormGroup({
            name: new FormControl(null, Validators.required),
            description: new FormControl(null),
            cloudDevice: new FormControl(null, Validators.required),
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

    get onSave$(): Subject<DevicePoolInput> {
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

    public compareCloudDevice(cloudDevice1: CloudDevice, cloudDevice2: CloudDevice): boolean {
        if (cloudDevice1 == null || cloudDevice2 == null) {
            return false;
        }
        return cloudDevice1.identifier === cloudDevice2.identifier && cloudDevice1.type === cloudDevice2.type;
    }

    private _createFormFromDevicePool(devicePool: DevicePool): void {
        const { name, description, cloudDevice, cloudClient } = devicePool;
        this.form.reset({ name, description, cloudDevice, cloudClient });

        // Initialise cloud devices with current cloud device
        this._cloudDevices = [null, cloudDevice];
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

        this._apollo.query<any>({
            query: gql`
                query cloudDevices($cloudId: Int!) {
                    cloudDevices(cloudId: $cloudId) {
                        identifier
                        type
                    }
                }
            `,
            variables: { cloudId },
        }).pipe(
            map(({data}) => (data.cloudDevices)),
        ).subscribe((cloudDevices: CloudDevice[]) => {
            cloudDevices = cloudDevices || [];
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

    public onCancel(): void {
        this._dialogRef.close();
    }

    public submit(): void {
        const {name, description, cloudClient, cloudDevice} = this.form.value;
        const input = {
            name,
            description,
            cloudId: cloudClient.id,
            computeIdentifier: cloudDevice.identifier,
            deviceType: cloudDevice.type,
        } as DevicePoolInput;
        this._onSave$.next(input);
    }

}
