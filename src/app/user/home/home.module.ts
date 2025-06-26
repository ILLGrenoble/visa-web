import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {SharedModule} from '@shared';
import {InstanceListModule} from '../instance-list';
import {InstanceNewModule} from '../instance-new/instance-new.module';
import {HomeComponent} from './home.component';
import {UserNotificationDialog} from "./dialogs";

@NgModule({
    imports: [
        CommonModule,
        SharedModule,
        InstanceNewModule,
        InstanceListModule,
    ],
    declarations: [
        HomeComponent,
        UserNotificationDialog,
    ]
})
export class HomeModule {

}
