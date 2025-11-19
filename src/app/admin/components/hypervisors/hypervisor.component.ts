import {Component, Input, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {Subject} from 'rxjs';
import {Apollo} from 'apollo-angular';
import {Hypervisor, HypervisorResource, DevicePool, Flavour} from '../../../core/graphql';
import * as Highcharts from "highcharts";
import {map, tap} from "rxjs/operators";
import gql from "graphql-tag";
import {HypervisorResourceChartData} from "./hypervisor-resource-chart-data";
import {FlavourStats, HypervisorFlavoursChartData} from "./hypervisor-flavours-chart-data";

@Component({
    selector: 'visa-admin-hypervisor',
    templateUrl: './hypervisor.component.html',
    styleUrls: ['./hypervisor.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class HypervisorComponent implements OnInit, OnDestroy {

    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _loading: boolean;
    private _hypervisor: Hypervisor;
    private _devicePools: DevicePool[];
    private _flavours: Flavour[];

    private _instanceCount: number;

    private _vcpuChartData: HypervisorResourceChartData;
    private _ramChartData: HypervisorResourceChartData;
    private _customChartData: HypervisorResourceChartData[];
    private _flavoursChartData: HypervisorFlavoursChartData;

    private _highcharts: typeof Highcharts = Highcharts;


    constructor(private readonly _apollo: Apollo) {
    }
    get loading(): boolean {
        return this._loading;
    }

    get hypervisor(): Hypervisor {
        return this._hypervisor;
    }

    @Input()
    set hypervisor(value: Hypervisor) {
        this._hypervisor = value;
    }

    @Input()
    set devicePools(value: DevicePool[]) {
        this._devicePools = value;
    }

    @Input()
    set flavours(value: Flavour[]) {
        this._flavours = value;
    }


    get instanceCount(): number {
        return this._instanceCount;
    }

    get vcpuChartData(): HypervisorResourceChartData {
        return this._vcpuChartData;
    }

    get ramChartData(): HypervisorResourceChartData {
        return this._ramChartData;
    }

    get customChartData(): HypervisorResourceChartData[] {
        return this._customChartData;
    }

    get flavoursChartData(): HypervisorFlavoursChartData {
        return this._flavoursChartData;
    }

    get highcharts(): typeof Highcharts {
        return this._highcharts;
    }

    public ngOnInit(): void {
        const cpuData = this._getResourceValue(this._hypervisor.resources, 'VCPU');
        const ramData = this._getResourceValue(this._hypervisor.resources, 'MEMORY_MB');
        const deviceResourceClasses = this._devicePools.map(devicePool => devicePool.resourceClass).filter(value => !!value);
        const hypervisorResourceClasses = this._hypervisor.resources.map(resource => resource.resourceClass);
        const customResources = this._hypervisor.resources
            .filter(resource => !['VCPU', 'MEMORY_MB', 'DISK_GB'].includes(resource.resourceClass))
            .filter(resource => deviceResourceClasses.includes(resource.resourceClass));
        const hypervisorEnabled = this._hypervisor.status === 'enabled';

        this._customChartData = customResources.map(resource => {
            const device = this._devicePools.find(device => device.resourceClass === resource.resourceClass);
            return new HypervisorResourceChartData(device.name, resource.total, resource.usage, hypervisorEnabled);
        })
        this._vcpuChartData = cpuData ? new HypervisorResourceChartData('vCPU', cpuData.total, cpuData.usage, hypervisorEnabled) : null;
        this._ramChartData = ramData ? new HypervisorResourceChartData('RAM GB', ramData.total / 1024, ramData.usage / 1024, hypervisorEnabled) : null;

        this._apollo.query<any>({
            query: gql`
                query hypervisor($hypervisorId: Int!) {
                    hypervisor(id: $hypervisorId) {
                        id
                        allocations {
                            serverComputeId
                            instance {
                                id
                                name
                                plan {
                                    flavour {
                                        id
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `,
            variables: { hypervisorId: this._hypervisor.id },
        }).pipe(
                map(({data}) => ({hypervisor: data.hypervisor})),
                tap(() => this._loading = false)
            )
            .subscribe(({hypervisor}) => {
                this._hypervisor.allocations = hypervisor.allocations;
                this._instanceCount = hypervisor.allocations?.reduce((acc, current) => {
                    acc = acc + (current.instance != null ? 1 : 0);
                    return acc;
                }, 0);

                const flavourData: FlavourStats[] = cpuData ? this._flavours.map(flavour => {
                    const instanceCount = hypervisor.allocations
                        .filter(allocation => allocation.instance != null)
                        .filter(allocation => allocation.instance.plan.flavour.id === flavour.id)
                        .length;

                    const ramUnitsAvailable = Math.floor((ramData.total - ramData.usage) / flavour.memory);
                    const cpuUnitsAvailable = Math.floor((cpuData.total - cpuData.usage) / flavour.cpu);
                    const customUnitsAvailable = flavour.devices
                        .filter(device => device.devicePool.resourceClass != null)
                        .map(device => {
                            if (hypervisorResourceClasses.includes(device.devicePool.resourceClass)) {
                                const resourceData = this._getResourceValue(this._hypervisor.resources, device.devicePool.resourceClass);
                                return Math.floor(resourceData.total - resourceData.usage) / device.unitCount;

                            } else {
                                return 0;
                            }
                        });


                    const unitsAvailable = Math.min(cpuUnitsAvailable, ramUnitsAvailable, ...customUnitsAvailable);
                    return {
                        flavour,
                        used: instanceCount,
                        available: unitsAvailable,
                    };
                }) : null;

                this._flavoursChartData = flavourData ? new HypervisorFlavoursChartData(flavourData, hypervisorEnabled) : null;
            });
    }

    public hypervisorStateClass(hypervisor: Hypervisor) {
        return `hypervisor__${hypervisor.state}_${hypervisor.status}`;
    }

    public ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    private _getResourceValue(resources: HypervisorResource[], resourceClass: string) {
        return resources.find((resource) => resource.resourceClass === resourceClass);
    }
}
