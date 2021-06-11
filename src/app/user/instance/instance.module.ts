import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {SharedModule} from '@shared';
import {VirtualDesktopModule} from '@vdi';
import {AccessRequestComponent} from './access-request';
import {ClipboardComponent} from './clipboard';
import {DeactivateComponent} from './deactivate';
import {DetailsComponent} from './details';
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
        DeactivateComponent,
        DetailsComponent,
        KeyboardComponent,
        KeyboardShortcutsComponent,
        InstanceComponent,
        MembersConnectedComponent,
        AccessRequestComponent,
        SettingsComponent,
        StatsComponent,
        UrlComponent
    ],
    entryComponents: [
        ClipboardComponent,
        DeactivateComponent,
        KeyboardComponent,
        SettingsComponent,
        MembersConnectedComponent,
        AccessRequestComponent,
        UrlComponent
    ],
})
export class InstanceModule {

}
