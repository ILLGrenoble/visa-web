import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {Hypervisor, HypervisorResource, Instance, InstanceState} from "../../../core/graphql";
import {Subject} from "rxjs";
import {takeUntil} from "rxjs/operators";
import {Apollo} from "apollo-angular";
import {NotifierService} from "angular-notifier";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import gql from "graphql-tag";

@Component({
    selector: 'visa-admin-server-migrate-dialog',
    templateUrl: './server-migrate-dialog.component.html',
    styleUrls: ['./server-migrate-dialog.component.scss'],
})
export class ServerMigrateDialogComponent implements OnInit, OnDestroy {

    private readonly _form: FormGroup;
    private _instance: Instance;
    private _source: Hypervisor;

    private _hypervisors: Hypervisor[] = [];
    private _destroy$: Subject<boolean> = new Subject<boolean>();

    private _migrationData$: Subject<{instance: Instance, source: Hypervisor, target: Hypervisor}>;
    private _onClose$: EventEmitter<Instance> = new EventEmitter();
    private _showModal = false;
    private _submitting = false;


    get form(): FormGroup {
        return this._form;
    }

    get instance(): Instance {
        return this._instance;
    }

    get source(): Hypervisor {
        return this._source;
    }

    get hypervisors(): Hypervisor[] {
        return this._hypervisors;
    }

    @Input()
    set hypervisors(value: Hypervisor[]) {
        this._hypervisors = value;
    }

    get showModal(): boolean {
        return this._showModal;
    }

    set showModal(value: boolean) {
        this._showModal = value;
    }

    @Input()
    set migrationData$(value: Subject<{ instance: Instance; source: Hypervisor; target: Hypervisor }>) {
        this._migrationData$ = value;
    }

    @Output()
    get onClose$(): EventEmitter<Instance> {
        return this._onClose$;
    }

    get submitting(): boolean {
        return this._submitting;
    }

    constructor(private readonly _apollo: Apollo,
                private readonly _notifierService: NotifierService) {
        this._form = new FormGroup({
            target: new FormControl(null, Validators.required),
            blockMigration: new FormControl(false, Validators.required),
            diskOverCommit: new FormControl(false, Validators.required),
            availableUnits: new FormControl(null, [Validators.required, Validators.min(1)]),
        });

        this._form.get('target').valueChanges.subscribe((target) => {
            this._form.controls.availableUnits.reset(this._calculateAvailableUnits(target));
        });
    }

    public ngOnInit(): void {
        this._migrationData$.pipe(
            takeUntil(this._destroy$),
        ).subscribe(data => {
            const {instance, source, target} = data;
            this._instance = instance;
            this._source = source;

            this._form.reset({
                target,
                blockMigration: false,
                diskOverCommit: false,
                availableUnits: this._calculateAvailableUnits(target),
            })

            this._showModal = true;
        });
    }

    public ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    public submit(): void {
        this._submitting = true;
        const {target, blockMigration, diskOverCommit } = this._form.value;
        this._apollo.mutate({
            mutation: gql`
                  mutation migrateCloudInstance($cloudId: Int!, $computeId: String!, $host: String!, $blockMigration: Boolean!, $diskOverCommit: Boolean!) {
                      migrateCloudInstance(cloudId: $cloudId, computeId: $computeId, host: $host, blockMigration: $blockMigration, diskOverCommit: $diskOverCommit)
                  }
                `,
            variables: {
                cloudId: this._source.cloudId,
                computeId: this.instance.computeId,
                host: target.hostname,
                blockMigration,
                diskOverCommit,
            },
        }).subscribe({
            next: () => {
                this._submitting = false;
                this._notifierService.notify('success', 'Instance migration in progress');
                this._showModal = false;
                this._instance.state = this._instance.state == InstanceState.Active ? InstanceState.ActiveMigrating : InstanceState.Migrating;
                this._onClose$.emit(this._instance);
            },
            error: (error) => {
                this._submitting = false;
                this._notifierService.notify('error', error);
            }
        });


    }

    public onCancel(): void {
        this._showModal = false;
        this._onClose$.emit(null);
    }


    public getResourcesView(): string {
        if (this.instance && this.instance.plan.flavour) {
            let value = this._getCpuView() + ', ' + this._getRamView();
            const devices = this._getDevicesView();
            if (devices) {
               value += ', ' + devices;
            }
            return value;
        }
        return null;
    }

    private _getCpuView(): string {
        if (this.instance && this.instance.plan.flavour) {
            return this.instance.plan.flavour.cpu + ' VCPU' + (this.instance.plan.flavour.cpu !== 1 ? 's' : '');
        }
        return null;
    }

    private _getRamView(): string {
        if (this.instance && this.instance.plan.flavour) {
            return (Math.round(this.instance.plan.flavour.memory / 1024 * 10) / 10) + ' GB RAM';
        }
        return null;
    }

    private _getDevicesView(): string {
        if (this.instance && this.instance.plan.flavour && this.instance.plan.flavour.devices.length > 0) {
            return this.instance.plan.flavour.devices.map(device => {
                return device.unitCount + ' x ' + device.devicePool.name;
            }).join(', ');
        }
        return null;
    }

    private _getResourceValue(resources: HypervisorResource[], resourceClass: string) {
        return resources.find((resource) => resource.resourceClass === resourceClass);
    }

    private _calculateAvailableUnits(hypervisor: Hypervisor) {
        const flavour = this.instance.plan.flavour;
        const cpuData = this._getResourceValue(hypervisor.resources, 'VCPU');
        const ramData = this._getResourceValue(hypervisor.resources, 'MEMORY_MB');

        const ramUnitsAvailable = Math.floor((ramData.total - ramData.usage) / flavour.memory);
        const cpuUnitsAvailable = Math.floor((cpuData.total - cpuData.usage) / flavour.cpu);
        const hypervisorResourceClasses = hypervisor.resources.map(resource => resource.resourceClass);

        const customUnitsAvailable = flavour.devices
            .filter(device => device.devicePool.resourceClass != null)
            .map(device => {
                if (hypervisorResourceClasses.includes(device.devicePool.resourceClass)) {
                    const resourceData = this._getResourceValue(hypervisor.resources, device.devicePool.resourceClass);
                    return Math.floor(resourceData.total - resourceData.usage) / device.unitCount;

                } else {
                    return 0;
                }
            });

        return Math.min(cpuUnitsAvailable, ramUnitsAvailable, ...customUnitsAvailable);
    }

}
