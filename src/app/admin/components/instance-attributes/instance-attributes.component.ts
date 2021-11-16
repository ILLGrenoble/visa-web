import {Component, Input} from '@angular/core';
import {Instance} from 'app/core/graphql';

@Component({
    selector: 'visa-admin-instance-attributes',
    templateUrl: './instance-attributes.component.html',
})
export class InstanceAttributesComponent {

    private _instance: Instance;

    @Input()
    public get instance(): Instance {
        return this._instance;
    }

    public set instance(instance: Instance) {
        this._instance = instance;
    }
}
