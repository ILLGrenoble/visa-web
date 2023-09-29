import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {SharedModule} from '@shared';
import {VirtualDesktopModule} from '@vdi';
import {AccessRequestComponent} from './access-request';
import {ClipboardComponent} from './clipboard';
import {InstanceComponent} from './instance.component';
import {KeyboardComponent} from './keyboard';
import {KeyboardShortcutsComponent} from './keyboard-shortcuts';
import {MembersConnectedComponent} from './members-connected';
import {SettingsComponent} from './settings';
import {StatsComponent} from './stats';
import {UrlComponent} from './url';
import {FileManagerComponent} from './file-manager';
import {VisaFileSysModule} from "visa-fs-client";
import {environment} from 'environments/environment';

@NgModule({
    imports: [
        CommonModule,
        SharedModule,
        VirtualDesktopModule,
        VisaFileSysModule.forRoot({
            basePath: environment.paths.visafs
        }),
    ],
    declarations: [
        ClipboardComponent,
        KeyboardComponent,
        KeyboardShortcutsComponent,
        InstanceComponent,
        MembersConnectedComponent,
        AccessRequestComponent,
        SettingsComponent,
        StatsComponent,
        UrlComponent,
        FileManagerComponent,
    ]
})
export class InstanceModule {

}
