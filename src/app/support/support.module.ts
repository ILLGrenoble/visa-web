import {SharedModule} from '@shared';
import {NgModule} from '@angular/core';
import {ROUTING} from './support.routing';
import {InstancesComponent, InstancesFilterComponent} from './components';
import {HeaderComponent} from './common';

@NgModule({
    imports: [
        SharedModule,
        ROUTING
    ],
    declarations: [
        HeaderComponent,
        InstancesComponent,
        InstancesFilterComponent
    ],
    exports: [
        InstancesComponent
    ]
})
export class SupportModule {


}
