import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';

import {SharedModule} from '@shared';
import {
    InstanceDisplaySelectComponent,
    InstanceExperimentSelectComponent,
    InstanceFlavourSelectComponent,
    InstanceImageSelectComponent,
    InstanceNewComponent,
} from './';

@NgModule({
    imports: [
        CommonModule,
        SharedModule,
    ],
    declarations: [
        InstanceExperimentSelectComponent,
        InstanceImageSelectComponent,
        InstanceFlavourSelectComponent,
        InstanceDisplaySelectComponent,
        InstanceNewComponent,
    ],
    exports: [
        InstanceNewComponent,
    ]
})
export class InstanceNewModule {

}
