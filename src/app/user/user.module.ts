import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {SharedModule} from '@shared';
import {HomeModule} from './home';
import {InstanceListModule} from './instance-list';
import {InstanceModule} from './instance';
import {ROUTING} from './user.routing';
import {JupyterModule} from './jupyter';

@NgModule({
    imports: [
        CommonModule,
        HomeModule,
        InstanceModule,
        JupyterModule,
        InstanceListModule,
        SharedModule,
        ROUTING,
    ],
    declarations: [],
    providers: []
})
export class UserModule {

}
