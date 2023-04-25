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

@NgModule({
    imports: [
        CommonModule,
        SharedModule,
        VirtualDesktopModule
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
        UrlComponent
    ]
})
export class InstanceModule {

}
