import {Component, Input, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {Subject} from 'rxjs';
import {Apollo} from 'apollo-angular';
import {Hypervisor, HypervisorResource, DevicePool} from '../../../core/graphql';
import * as Highcharts from "highcharts";

const hex2rgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    return { r, g, b };
}

const componentToHex = (c) => {
    const hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

const rgbToHex = (r, g, b) => {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

export class HypervisorChartData {


    private _options: any = {
        chart: {
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false,
            type: 'pie',
        },
        title: {
            text: '',
        },
        subtitle: {
            text: this.getSubtitle(),
            floating: true,
            useHTML: true,
            verticalAlign: 'middle',
            y: 12
        },
        plotOptions: {
            series: {
                borderRadius: 0,
                allowPointSelect: true,
                cursor: 'pointer',
                showInLegend: false,
            },
        },
        credits: {
            enabled: false,
        },
        series: [{
            type: 'pie',
            colorByPoint: true,
            innerSize: '75%',
            borderColor: '#cccccc',
            dataLabels: {
                enabled: false
            },
            data: [],
        }],
    }

    get options(): any {
        return this._options;
    }

    constructor(private _resource: string, private _total: number, private _used: number, private _enabled: boolean) {
        this._options.series[0].data = [
            { name: 'used', y: Math.floor(this._used), color: this.getSeverityColour(this._used / this._total)},
            { name: 'available', y: Math.floor(this._total - this._used), color: '#ffffff'},
        ]
        this._options.series[0].borderColor = this._enabled ? '#cccccc' : '#dddddd';
    }

    private getSubtitle(): string {
        const extraStyle = this._enabled ? '' : 'chart-title-container__disabled';
        return `
            <div class="chart-title-container ${extraStyle}">
              <div class="chart-title-main">${this._resource}</div>
              <div class="chart-title-sub">${Math.floor(this._used)} / ${Math.floor(this._total)}</div>
            </div>
        `;
    }

    private getSeverityColour(value: number): string {
        if (!this._enabled) {
            return '#cccccc';
        }

        value = Math.max(0.0, Math.min(value, 1.0));

        const colours = [
            hex2rgb('#00a65a'),
            hex2rgb('#00a65a'),
            hex2rgb('#00a65a'),
            hex2rgb('#ffcc00'),
            hex2rgb('#ff9900'),
            hex2rgb('#dd4b39'),
        ]

        const i1 = Math.floor((colours.length - 1) * value);
        const i2 = Math.ceil((colours.length - 1) * value);

        const colourStep = 1.0 / (colours.length - 1);
        const diff = value - i1 * colourStep;

        const colour = {
            r: Math.floor(colours[i1].r + diff * (colours[i2].r - colours[i1].r)),
            g: Math.floor(colours[i1].g + diff * (colours[i2].g - colours[i1].g)),
            b: Math.floor(colours[i1].b + diff * (colours[i2].b - colours[i1].b)),
        }

        return rgbToHex(colour.r, colour.g, colour.b);
    }

}

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

    private _vcpuChartData: HypervisorChartData;
    private _ramChartData: HypervisorChartData;
    private _customChartData: HypervisorChartData[];
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

    get vcpuChartData(): HypervisorChartData {
        return this._vcpuChartData;
    }

    get ramChartData(): HypervisorChartData {
        return this._ramChartData;
    }

    get customChartData(): HypervisorChartData[] {
        return this._customChartData;
    }

    get highcharts(): typeof Highcharts {
        return this._highcharts;
    }

    public ngOnInit(): void {
        const cpuData = this._getResourceValue(this._hypervisor.resources, 'VCPU');
        const ramData = this._getResourceValue(this._hypervisor.resources, 'MEMORY_MB');
        const deviceResourceClasses = this._devicePools.map(devicePool => devicePool.resourceClass).filter(value => !!value);
        const customResources = this._hypervisor.resources
            .filter(resource => !['VCPU', 'MEMORY_MB', 'DISK_GB'].includes(resource.resourceClass))
            .filter(resource => deviceResourceClasses.includes(resource.resourceClass));
        const hypervisorEnabled = this._hypervisor.status === 'enabled';

        this._customChartData = customResources.map(resource => {
            const device = this._devicePools.find(device => device.resourceClass === resource.resourceClass);
            return new HypervisorChartData(device.name, resource.total, resource.usage, hypervisorEnabled);
        })
        this._vcpuChartData = cpuData ? new HypervisorChartData('vCPU', cpuData.total, cpuData.usage, hypervisorEnabled) : null;
        this._ramChartData = ramData ? new HypervisorChartData('RAM GB', ramData.total / 1024, ramData.usage / 1024, hypervisorEnabled) : null;


        // this._apollo.query<any>({
        //     query: gql`
        //         query hypervisors {
        //             hypervisors {
        //                 id
        //                 computeId
        //                 hostname
        //                 state
        //                 status
        //                 cloudId
        //                 resources {
        //                     resourceClass
        //                     total
        //                     usage
        //                 }
        //                 allocations {
        //                     serverComputeId
        //                 }
        //             }
        //             devicePools {
        //                 name
        //                 resourceClass
        //             }
        //             cloudClients {
        //                 id
        //             }
        //         }
        //     `
        //     }).pipe(
        //         map(({data}) => ({hypervisors: data.hypervisors, cloudClients: data.cloudClients, devicePools: data.devicePools})),
        //         tap(() => this._loading = false)
        //     )
        //     .subscribe(({hypervisors, cloudClients, devicePools}) => {
        //
        //     });
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
