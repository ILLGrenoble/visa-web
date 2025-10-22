import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {
    CloudDevice, CloudDeviceAllocation,
    DevicePool,
    DevicePoolInput,
    Flavour,
    FlavourInput,
    Instrument,
    DevicePoolUsage,
    Role
} from '../../../core/graphql';
import {FlavourDeleteComponent} from '../flavour-delete';
import {Apollo} from 'apollo-angular';
import gql from 'graphql-tag';
import {delay, filter, map, startWith, switchMap, takeUntil, tap} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {NotifierService} from 'angular-notifier';
import {FlavourEditComponent} from '../flavour-edit';
import {DevicePoolEditComponent} from "../device-pool-edit";
import {DevicePoolDeleteComponent} from "../device-pool-delete";

@Component({
    selector: 'visa-admin-flavours',
    templateUrl: './flavours.component.html',
    styleUrls: ['./flavours.component.scss']
})

export class FlavoursComponent implements OnInit, OnDestroy {

    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _refreshFlavours$: Subject<void> = new Subject();
    private _refreshDevices$: Subject<void> = new Subject();
    private _flavours: Flavour[] = [];
    private _devicePools: DevicePool[] = [];
    private _devicePoolCounts: DevicePoolUsage[];
    private _instruments: Instrument[];
    private _roles: Role[];
    private _loadingFlavours: boolean;
    private _loadingDevices: boolean;
    private _multiCloudEnabled = false;

    constructor(private readonly _apollo: Apollo,
                private readonly _notifierService: NotifierService,
                private readonly _dialog: MatDialog) {
    }

    get flavours(): Flavour[] {
        return this._flavours;
    }

    get devicePools(): DevicePool[] {
        return this._devicePools;
    }

    get loadingFlavours(): boolean {
        return this._loadingFlavours;
    }

    get loadingDevices(): boolean {
        return this._loadingDevices;
    }

    public onRefreshFlavours(): void {
        this._refreshFlavours$.next();
    }

    public onRefreshDevices(): void {
        this._refreshDevices$.next();
    }

    get multiCloudEnabled(): boolean {
        return this._multiCloudEnabled;
    }

    public ngOnInit(): void {
        this._refreshFlavours$
            .pipe(
                startWith(0),
                takeUntil(this._destroy$),
                tap(() => this._loadingFlavours = true),
                delay(250),
                switchMap(() => this._apollo.query<any>({
                    query: gql`
                        query AllFlavours {
                            flavours {
                                id
                                name
                                memory
                                cpu
                                computeId
                                cloudFlavour {
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
                                devices {
                                    devicePool {
                                        id
                                        name
                                        description
                                        cloudDevice {
                                            identifier
                                            type
                                        }
                                    }
                                    unitCount
                                }
                                cloudClient {
                                    id
                                    name
                                }
                            }
                            instruments {
                                id
                                name
                            }
                            rolesAndGroups {
                                id
                                name
                            }
                            cloudClients {
                                id
                            }
                        }
                    `
                })),
                map(({data}) => ({
                    flavours: data.flavours,
                    devicePools: data.devicePools,
                    instruments: data.instruments,
                    roles: data.rolesAndGroups,
                    cloudClients: data.cloudClients,
                })),
                tap(() => this._loadingFlavours = false)
            )
            .subscribe(({flavours, instruments, roles, cloudClients}) => {
                this._flavours = flavours;
                this._instruments = instruments;
                this._roles = roles;
                this._multiCloudEnabled = cloudClients.length > 1 || flavours
                    .map((flavour) => flavour.cloudClient?.id || 0)
                    .filter((value, index, array) => array.indexOf(value) === index)
                    .length > 1;
            });

        this._refreshDevices$
            .pipe(
                startWith(0),
                takeUntil(this._destroy$),
                tap(() => this._loadingDevices = true),
                delay(250),
                switchMap(() => this._apollo.query<any>({
                    query: gql`
                        query AllDevices {
                            devicePools {
                                id
                                name
                                description
                                totalUnits
                                cloudDevice {
                                    identifier
                                    type
                                }
                                cloudClient {
                                    id
                                    name
                                }
                            }
                            devicePoolUsage {
                                devicePoolId
                                devicePoolName
                                totalUnits
                                usedUnits
                            }
                        }
                    `
                })),
                map(({data}) => ({
                    devicePools: data.devicePools,
                    counts: data.devicePoolUsage,
                })),
                tap(() => this._loadingDevices = false)
            )
            .subscribe(({devicePools, counts}) => {
                this._devicePools = devicePools;
                this._devicePoolCounts = counts;
            });
    }

    public ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    public onCreate(flavour?: Flavour): void {
        const dialogRef = this._dialog.open(FlavourEditComponent, {
            width: '800px',
            data: { flavour, instruments: this._instruments, roles: this._roles, clone: !!flavour },
        });
        dialogRef.componentInstance.onSave$.pipe(
            switchMap((input: FlavourInput) => {
                return this._apollo.mutate<any>({
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
                );
            })).subscribe({
                next: () => {
                    this._notifierService.notify('success', 'Flavour created');
                    this._refreshFlavours$.next();
                    dialogRef.close();
                },
                error: (error) => {
                    this._notifierService.notify('error', error);
                }
            });
    }

    public onDelete(flavour: Flavour): void {
        const dialogRef = this._dialog.open(FlavourDeleteComponent, {
            width: '400px'
        });

        dialogRef.afterClosed().pipe(
            filter(result => result),
            switchMap(() => {
                return this._apollo.mutate({
                    mutation: gql`
                        mutation DeleteFlavour($id: Int!){
                            deleteFlavour(id:$id) {
                                id
                            }
                        }
                    `,
                    variables: {id: flavour.id},
                }).pipe(
                    takeUntil(this._destroy$),
                )
            })).subscribe({
                next: () => {
                    this._notifierService.notify('success', 'Successfully deleted flavour');
                    this._refreshFlavours$.next();
                },
                error: (error) => {
                    this._notifierService.notify('error', error);
                }
            });
    }

    public onUpdate(flavour: Flavour): void {
        const dialogRef = this._dialog.open(FlavourEditComponent, {
            width: '800px', data: { flavour, instruments: this._instruments, roles: this._roles },
        });

        dialogRef.componentInstance.onSave$.pipe(
            switchMap((input: FlavourInput) => {
                return this._apollo.mutate<any>({
                    mutation: gql`
                        mutation UpdateFlavour($id: Int!, $input: FlavourInput!){
                            updateFlavour(id: $id, input: $input) {
                                id
                            }
                        }
                        `,
                    variables: {id: flavour.id, input},
                }).pipe(
                    takeUntil(this._destroy$)
                )
            })).subscribe({
                next: () => {
                    this._notifierService.notify('success', 'Flavour saved');
                    this._refreshFlavours$.next();
                    dialogRef.close();
                },
                error: (error) => {
                    this._notifierService.notify('error', error);
                }
            });
    }


    public onCreateDevicePool(devicePool?: DevicePool): void {
        const dialogRef = this._dialog.open(DevicePoolEditComponent, {
            width: '800px',
            data: { devicePool, clone: !!devicePool, configuredDevicePools: this._devicePools },
        });
        dialogRef.componentInstance.onSave$.pipe(
            switchMap((input: DevicePoolInput) => {
                return this._apollo.mutate<any>({
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
                );
            })).subscribe({
            next: () => {
                this._notifierService.notify('success', 'Device Pool created');
                this._refreshDevices$.next();
                this._refreshFlavours$.next();
                dialogRef.close();
            },
            error: (error) => {
                this._notifierService.notify('error', error);
            }
        });
    }

    public onUpdateDevicePool(devicePool: DevicePool): void {
        const dialogRef = this._dialog.open(DevicePoolEditComponent, {
            width: '800px', data: { devicePool, configuredDevicePools: this._devicePools },
        });

        dialogRef.componentInstance.onSave$.pipe(
            switchMap((input: DevicePoolInput) => {
                return this._apollo.mutate<any>({
                    mutation: gql`
                        mutation updateDevicePool($id: Int!, $input: DevicePoolInput!){
                            updateDevicePool(id: $id, input: $input) {
                                id
                            }
                        }
                        `,
                    variables: {id: devicePool.id, input},
                }).pipe(
                    takeUntil(this._destroy$)
                )
            })).subscribe({
            next: () => {
                this._notifierService.notify('success', 'Device Pool saved');
                this._refreshDevices$.next();
                this._refreshFlavours$.next();
                dialogRef.close();
            },
            error: (error) => {
                this._notifierService.notify('error', error);
            }
        });
    }

    public onDeleteDevicePool(devicePool: DevicePool): void {
        const dialogRef = this._dialog.open(DevicePoolDeleteComponent, {
            width: '400px'
        });

        dialogRef.afterClosed().pipe(
            filter(result => result),
            switchMap(() => {
                return this._apollo.mutate({
                    mutation: gql`
                        mutation deleteDevicePool($id: Int!){
                            deleteDevicePool(id:$id) {
                                id
                            }
                        }
                    `,
                    variables: {id: devicePool.id},
                }).pipe(
                    takeUntil(this._destroy$),
                )
            })).subscribe({
            next: () => {
                this._notifierService.notify('success', 'Successfully deleted device pool');
                this._refreshDevices$.next();
                this._refreshFlavours$.next();
            },
            error: (error) => {
                this._notifierService.notify('error', error);
            }
        });
    }

    public unconfiguredCloudDevices(flavour: Flavour): CloudDeviceAllocation[] {
        const configuredCloudDevices: CloudDevice[] = flavour.devices.map(flavourDevice => flavourDevice.devicePool.cloudDevice);
        return flavour.cloudFlavour.deviceAllocations
            .filter(deviceAllocation => {
                return configuredCloudDevices.find(configuredCloudDevice => configuredCloudDevice.identifier === deviceAllocation.device.identifier && configuredCloudDevice.type === deviceAllocation.device.type) == null;
            })
    }

    public devicePoolUsage(devicePool: DevicePool): number {
        return this._devicePoolCounts.find(devicePoolCount => devicePoolCount.devicePoolId === devicePool.id)?.usedUnits || 0;
    }

}
