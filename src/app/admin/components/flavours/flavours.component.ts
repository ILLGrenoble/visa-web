import {Component, OnDestroy, OnInit} from '@angular/core';
import {
    CloudDevice, CloudDeviceAllocation,
    DevicePool,
    Flavour,
    Instrument,
    DevicePoolUsage,
    Role, Hypervisor
} from '../../../core/graphql';
import {Apollo} from 'apollo-angular';
import gql from 'graphql-tag';
import {delay, map, startWith, switchMap, takeUntil, tap} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {NotifierService} from 'angular-notifier';

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
    private _hypervisors: Hypervisor[];
    private _roles: Role[];
    private _loadingFlavours: boolean;
    private _loadingDevices: boolean;
    private _multiCloudEnabled = false;

    private _flavourModalData$ = new Subject<{ flavour: Flavour, clone: boolean }>();
    private _flavourToDelete: Flavour;

    private _devicePoolModalData$ = new Subject<{ devicePool: DevicePool, clone: boolean }>();
    private _devicePoolToDelete: DevicePool;

    get flavours(): Flavour[] {
        return this._flavours;
    }

    get devicePools(): DevicePool[] {
        return this._devicePools;
    }

    get hypervisors(): Hypervisor[] {
        return this._hypervisors;
    }

    get instruments(): Instrument[] {
        return this._instruments;
    }

    get roles(): Role[] {
        return this._roles;
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

    get flavourModalData$(): Subject<{ flavour: Flavour; clone: boolean }> {
        return this._flavourModalData$;
    }

    get showFlavourDeleteModal(): boolean {
        return this._flavourToDelete != null;
    }

    get flavourToDelete(): Flavour {
        return this._flavourToDelete;
    }

    get devicePoolModalData$(): Subject<{ devicePool: DevicePool; clone: boolean }> {
        return this._devicePoolModalData$;
    }

    get showDevicePoolDeleteModal(): boolean {
        return this._devicePoolToDelete != null;
    }

    get devicePoolToDelete(): DevicePool {
        return this._devicePoolToDelete;
    }

    constructor(private readonly _apollo: Apollo,
                private readonly _notifierService: NotifierService) {
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
                                        resourceClass
                                        cloudDevice {
                                            identifier
                                            type
                                        }
                                    }
                                    unitCount
                                }
                                roleLifetimes {
                                  id
                                  role {
                                    id
                                    name
                                  }
                                  lifetimeMinutes
                                }
                                cloudClient {
                                    id
                                    name
                                }
                            }
                            hypervisors {
                                id
                                hostname
                                state
                                status
                                cloudId
                                resources {
                                    resourceClass
                                    total
                                    usage
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
                    hypervisors: data.hypervisors,
                })),
                tap(() => this._loadingFlavours = false)
            )
            .subscribe(({flavours, instruments, roles, cloudClients, hypervisors}) => {
                this._flavours = flavours;
                this._instruments = instruments;
                this._roles = roles;
                this._multiCloudEnabled = cloudClients.length > 1 || flavours
                    .map((flavour) => flavour.cloudClient?.id || 0)
                    .filter((value, index, array) => array.indexOf(value) === index)
                    .length > 1;
                this._hypervisors = hypervisors;
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
                                resourceClass
                                totalUnits
                                cloudDevice {
                                    identifier
                                    type
                                }
                                cloudClient {
                                    id
                                    name
                                    type
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
        this.flavourModalData$.next({flavour: flavour, clone: !!flavour});
    }

    public onDelete(flavour: Flavour): void {
        this._flavourToDelete = flavour;
    }

    public onConfirmFlavourDelete(): void {
        if (this._flavourToDelete) {
            this._apollo.mutate({
                mutation: gql`
                    mutation DeleteFlavour($id: Int!){
                        deleteFlavour(id:$id) {
                            id
                        }
                    }
                `,
                variables: {id: this._flavourToDelete.id},
            }).pipe(
                takeUntil(this._destroy$),
            ).subscribe({
                next: () => {
                    this._flavourToDelete = null;
                    this._notifierService.notify('success', 'Successfully deleted flavour');
                    this._refreshFlavours$.next();
                },
                error: (error) => {
                    this._notifierService.notify('error', error);
                }
            });
        }
    }

    public onFlavourDeleteModalClosed(): void {
        this._flavourToDelete = null;
    }

    public onUpdate(flavour: Flavour): void {
        this.flavourModalData$.next({flavour, clone: false});
    }

    public onFlavourSaved(): void {
        this._refreshFlavours$.next();
    }

    public onCreateDevicePool(devicePool?: DevicePool): void {
        this.devicePoolModalData$.next({devicePool: devicePool, clone: !!devicePool});
    }

    public onUpdateDevicePool(devicePool: DevicePool): void {
        this.devicePoolModalData$.next({devicePool: devicePool, clone: false});
    }

    public onDeleteDevicePool(devicePool: DevicePool): void {
        this._devicePoolToDelete = devicePool;
    }

    public onConfirmDevicePoolDelete(): void {
        if (this._devicePoolToDelete) {
            this._apollo.mutate({
                mutation: gql`
                        mutation deleteDevicePool($id: Int!){
                            deleteDevicePool(id:$id) {
                                id
                            }
                        }
                    `,
                variables: {id: this._devicePoolToDelete.id},
            }).pipe(
                takeUntil(this._destroy$),
            ).subscribe({
                next: () => {
                    this._devicePoolToDelete = null;
                    this._notifierService.notify('success', 'Successfully deleted device pool');
                    this._refreshDevices$.next();
                    this._refreshFlavours$.next();
                },
                error: (error) => {
                    this._notifierService.notify('error', error);
                }
            });
        }
    }

    public onDevicePoolDeleteModalClosed(): void {
        this._devicePoolToDelete = null;
    }

    public onDevicePoolSaved(): void {
        this._refreshDevices$.next();
        this._refreshFlavours$.next();
    }

    public unconfiguredCloudDevices(flavour: Flavour): CloudDeviceAllocation[] {
        const configuredCloudDevices: CloudDevice[] = flavour.devices.map(flavourDevice => flavourDevice.devicePool.cloudDevice);
        return flavour.cloudFlavour.deviceAllocations
            .filter(deviceAllocation => {
                return configuredCloudDevices.find(configuredCloudDevice => configuredCloudDevice.identifier === deviceAllocation.device.identifier && configuredCloudDevice.type === deviceAllocation.device.type) == null;
            })
    }

    public devicePoolTotal(devicePool: DevicePool): string {
        const devicePoolCount = this._devicePoolCounts.find(devicePoolCount => devicePoolCount.devicePoolId === devicePool.id);
        if (devicePoolCount && devicePoolCount.totalUnits >= 0) {
            return `${devicePoolCount.totalUnits}`;
        }
        return 'unknown';
    }

    public devicePoolUsage(devicePool: DevicePool): number {
        return this._devicePoolCounts.find(devicePoolCount => devicePoolCount.devicePoolId === devicePool.id)?.usedUnits || 0;
    }

}
