import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {SharedModule} from '@shared';
import {HomeModule} from './home';
import {InstanceListModule} from './instance-list';
import {InstanceModule} from './instance';
import {ROUTING} from './user.routing';
import {JupyterModule} from './jupyter';
import {VisaPrintModule} from '@illgrenoble/visa-print-client';

@NgModule({
    imports: [
        CommonModule,
        HomeModule,
        InstanceModule,
        JupyterModule,
        InstanceListModule,
        SharedModule,
        VisaPrintModule,
        ROUTING,
    ],
    declarations: [],
    providers: [
    ]
})
export class UserModule {

}
