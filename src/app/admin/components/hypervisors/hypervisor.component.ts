import {
    AfterViewChecked,
    AfterViewInit,
    Component,
    ElementRef, EventEmitter,
    Input,
    OnDestroy,
    OnInit, Output,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import {BehaviorSubject, fromEvent, Subject} from 'rxjs';
import {Apollo} from 'apollo-angular';
import {Hypervisor, HypervisorResource, DevicePool, Flavour, Instance} from '../../../core/graphql';
import * as Highcharts from "highcharts";
import {map, takeUntil, tap} from "rxjs/operators";
import gql from "graphql-tag";
import {HypervisorResourceChartData} from "./hypervisor-resource-chart-data";
import {FlavourStats, HypervisorFlavoursChartData} from "./hypervisor-flavours-chart-data";
import {DndDropEvent} from "ngx-drag-drop";

@Component({
    selector: 'visa-admin-hypervisor',
    templateUrl: './hypervisor.component.html',
    styleUrls: ['./hypervisor.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class HypervisorComponent implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked {

    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _loading: boolean;
    private _hypervisor: Hypervisor;
    private _index: number = 0;
    private _devicePools: DevicePool[];
    private _flavours: Flavour[];
    private _selectedHypervisor$: BehaviorSubject<Hypervisor>;
    private _selectedHypervisor: Hypervisor;
    private _isSelected: boolean = false;

    private _instanceCount: number;
    private _instances: Instance[] = [];

    private _vcpuChartData: HypervisorResourceChartData;
    private _ramChartData: HypervisorResourceChartData;
    private _customChartData: HypervisorResourceChartData[];
    private _flavoursChartData: HypervisorFlavoursChartData;
    private _flavourData: FlavourStats[];

    private _highcharts: typeof Highcharts = Highcharts;

    private _acceptDrop = false;
    private _draggable: {instance: Instance, hypervisor: Hypervisor};
    private _draggableChange: EventEmitter<{instance: Instance, hypervisor: Hypervisor}> = new EventEmitter();
    private _onMigrateRequest$: EventEmitter<{instance: Instance, source: Hypervisor, target: Hypervisor}> = new EventEmitter();
    private _reloadAllocations$: Subject<void>;

    @ViewChild('hyperv') _hypervisorElement: ElementRef;
    @ViewChild('hypervinstances') _instancesElement: ElementRef;
    @ViewChild('hypervspacer') _spacerElement: ElementRef;

    constructor(private readonly _apollo: Apollo,
                private _el: ElementRef) {
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
    set index(index: number) {
        this._index = index;
    }

    @Input()
    set devicePools(value: DevicePool[]) {
        this._devicePools = value;
    }

    @Input()
    set flavours(value: Flavour[]) {
        this._flavours = value;
    }

    @Input()
    set selectedHypervisor$(value: BehaviorSubject<Hypervisor>) {
        this._selectedHypervisor$ = value;
    }

    get selectedHypervisor(): Hypervisor {
        return this._selectedHypervisor;
    }

    @Input()
    set reloadAllocations$(value: Subject<void>) {
        this._reloadAllocations$ = value;
    }

    get isSelected(): boolean {
        return this._isSelected;
    }

    get instanceCount(): number {
        return this._instanceCount;
    }

    get instances(): Instance[] {
        return this._instances;
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

    get acceptDrop(): boolean {
        return this._acceptDrop;
    }

    @Input()
    set draggable(value: { instance: Instance; hypervisor: Hypervisor }) {
        this._draggable = value;

        if (value) {
            const flavour = value.instance.plan.flavour;
            const flavourStats = this._flavourData == null ? null : this._flavourData.find(data => data.flavour.id === flavour.id);
            const instancePossible = flavourStats == null ? true : flavourStats.available > 0;

            this._acceptDrop = value.hypervisor != this._hypervisor &&
                this._hypervisor?.status !== 'disabled' &&
                this._hypervisor?.state !== 'down' &&
                instancePossible;

        } else {
            this._acceptDrop = false;
        }
    }

    @Output()
    get draggableChange(): EventEmitter<{ instance: Instance, hypervisor: Hypervisor }> {
        return this._draggableChange;
    }

    @Output()
    get onMigrateRequest(): EventEmitter<{ instance: Instance; source: Hypervisor; target: Hypervisor }> {
        return this._onMigrateRequest$;
    }

    public ngOnInit(): void {
        this._reloadAllocations();

        this._reloadAllocations$.pipe(
            takeUntil(this._destroy$),
        ).subscribe(() => {
            this._reloadAllocations();
        });

        this._selectedHypervisor$.pipe(
            takeUntil(this._destroy$),
        ).subscribe(hypervisor => {
            this._selectedHypervisor = hypervisor;
            if (this._selectedHypervisor == this._hypervisor) {
                this._instancesElement.nativeElement.style.display = 'block';
                this._spacerElement.nativeElement.style.display = 'block';
                this._isSelected = true;
            } else if (this._instancesElement) {
                this._instancesElement.nativeElement.style.display = 'none';
                this._spacerElement.nativeElement.style.display = 'none';
                this._isSelected = false;
            }
        });

        fromEvent(window, 'resize')
            .pipe(takeUntil(this._destroy$))
            .subscribe((event: Event) => {
                this.updateInstancesElement();
            });
    }

    public ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    public ngAfterViewInit() {
        this.updateInstancesElement();
    }

    public ngAfterViewChecked() {
        this.updateInstancesElement();
    }

    public hypervisorStateClass(hypervisor: Hypervisor) {
        return `hypervisor__${hypervisor.state}_${hypervisor.status}`;
    }

    public onClick(): void {
        if (this._hypervisor.state !== 'down') {
            if (this._selectedHypervisor == this._hypervisor) {
                this._selectedHypervisor$.next(null);

            } else {
                this._selectedHypervisor$.next(this._hypervisor);
            }
        }
    }

    public onDraggable(draggable: {instance: Instance}) {
        this._draggableChange.emit({instance: draggable.instance, hypervisor: this._hypervisor});
    }

    public onDrop(event: DndDropEvent): void {
        const instance = event.data;
        if (instance.id == this._draggable.instance.id) {
            this._onMigrateRequest$.next({instance: this._draggable.instance, source: this._draggable.hypervisor, target: this._hypervisor });
        }
    }

    private _reloadAllocations(): void {
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
                                    createdAt
                                    terminationDate
                                    state
                                    computeId
                                    owner {
                                        fullName
                                    }
                                    plan {
                                        image {
                                            id
                                            name
                                            version
                                        }
                                        flavour {
                                            id
                                            name
                                            memory
                                            cpu
                                            devices {
                                                devicePool {
                                                    id
                                                    name
                                                }
                                                unitCount
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                `,
                variables: { hypervisorId: this._hypervisor.id },
            }).pipe(
                takeUntil(this._destroy$),
                map(({data}) => ({hypervisor: data.hypervisor})),
                tap(() => this._loading = false)
            ).subscribe(({hypervisor}) => {
                this._hypervisor.allocations = hypervisor.allocations;
                this._instanceCount = hypervisor.allocations?.reduce((acc, current) => {
                    acc = acc + (current.instance != null ? 1 : 0);
                    return acc;
                }, 0);
                this._instances = hypervisor.allocations?.map(allocation => allocation.instance).filter(instance => !!instance);
                this._instances.sort((i1, i2) => i1.id - i2.id);

                this._flavourData = cpuData ? this._flavours.map(flavour => {
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

                this._flavoursChartData = this._flavourData ? new HypervisorFlavoursChartData(this._flavourData, hypervisorEnabled) : null;
            });
    }

    private updateInstancesElement(): void {
        const parentWidth = this._el.nativeElement.parentElement.clientWidth;
        const width = this._el.nativeElement.clientWidth;
        const height = this._hypervisorElement.nativeElement.clientHeight;

        const columns = Math.floor(parentWidth / width);
        const column = this._index % columns;

        this._instancesElement.nativeElement.style.top = `${(height + 21)}px`;
        this._instancesElement.nativeElement.style.left = `-${(column * width)}px`;
        this._instancesElement.nativeElement.style.width = `${(columns * width) - 16}px`;

        const instancesHeight = this._instancesElement.nativeElement.clientHeight;
        this._spacerElement.nativeElement.style.height = `${(instancesHeight + 1)}px`;

    }

    private _getResourceValue(resources: HypervisorResource[], resourceClass: string) {
        return resources.find((resource) => resource.resourceClass === resourceClass);
    }
}
