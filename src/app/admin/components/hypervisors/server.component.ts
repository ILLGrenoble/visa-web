import {Component, EventEmitter, Input, Output} from '@angular/core';
import {Instance} from '../../../core/graphql';
import {Router} from "@angular/router";

@Component({
    selector: 'visa-admin-server',
    templateUrl: './server.component.html',
    styleUrls: ['./server.component.scss'],
})
export class ServerComponent  {

    private _instance: Instance;
    private _draggable$: EventEmitter<{instance: Instance}> = new EventEmitter();
    constructor(private _router: Router) {
    }

    @Input()
    set instance(value: Instance) {
        this._instance = value;
    }

    get instance(): Instance {
        return this._instance;
    }

    @Output()
    get draggable$(): EventEmitter<{ instance: Instance }> {
        return this._draggable$;
    }

    get dragDisabled(): boolean {
        return this._instance.plan.flavour.devices.length > 0;
    }

    protected instanceStateClass(): string {
        let stateClass: string;
        if (['ACTIVE', 'PARTIALLY_ACTIVE'].includes(this._instance.state)) {
            stateClass = 'server__active';
        } else if (['ACTIVE_MIGRATING'].includes(this._instance.state)) {
            stateClass = 'server__active server__migrating';
        } else if (['BUILDING', 'STARTING', 'STOPPED', 'STOPPING', 'DELETING', 'REBOOTING', 'MIGRATING'].includes(this._instance.state)) {
            stateClass = 'server__unready';
        } else {
            stateClass = 'server__error';
        }

        return stateClass;
    }

    protected onClick(): void {
        this._router.navigate([`/admin/compute/instances/${this._instance.id}`]);
    }

    protected onDragStarted(): void {
        this._draggable$.emit({instance: this._instance});
    }
}
