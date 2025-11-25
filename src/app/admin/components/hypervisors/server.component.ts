import {Component,  Input } from '@angular/core';
import {Instance} from '../../../core/graphql';
import {Router} from "@angular/router";

@Component({
    selector: 'visa-admin-server',
    templateUrl: './server.component.html',
    styleUrls: ['./server.component.scss'],
})
export class ServerComponent  {

    private _instance: Instance;
    constructor(private _router: Router) {
    }

    @Input()
    set instance(value: Instance) {
        this._instance = value;
    }

    get instance(): Instance {
        return this._instance;
    }

    protected instanceStateClass(): string {
        if (['ACTIVE', 'PARTIALLY_ACTIVE'].includes(this._instance.state)) {
            return 'server__active';
        } else if (['BUILDING', 'STARTING', 'STOPPED', 'STOPPING', 'DELETING', 'REBOOTING'].includes(this._instance.state)) {
            return 'server__unready';
        } else {
            return 'server__error';
        }
    }

    protected onClick(): void {
        this._router.navigate([`/admin/compute/instances/${this._instance.id}`]);
    }
}
