import {CommonModule, LocationStrategy, PathLocationStrategy} from '@angular/common';
import {Injectable, NgModule} from '@angular/core';

import {
    ConnectingMessageComponent,
    DisconnectedMessageComponent,
    DisplayComponent,
    ErrorMessageComponent,
    MessageComponent,
    RemoteDesktopComponent,
    StatusBarComponent,
    StatusBarItemComponent,
    ToolbarItemComponent,
} from './components';
import {HAMMER_GESTURE_CONFIG, HammerGestureConfig, HammerModule} from '@angular/platform-browser';

@Injectable()
export class HammerConfig extends HammerGestureConfig {
    overrides = {
        pan: {threshold: 5},
        press: {time: 500}
    } as any;
}

@NgModule({
    imports: [
        CommonModule,
        HammerModule,
    ],
    declarations: [
        RemoteDesktopComponent,
        ToolbarItemComponent,
        MessageComponent,
        DisplayComponent,
        ErrorMessageComponent,
        DisconnectedMessageComponent,
        ConnectingMessageComponent,
        StatusBarComponent,
        StatusBarItemComponent,
    ],
    exports: [
        RemoteDesktopComponent,
        ToolbarItemComponent,
        ErrorMessageComponent,
        DisconnectedMessageComponent,
        ConnectingMessageComponent,
        StatusBarComponent,
        StatusBarItemComponent
    ],
    entryComponents: [],
    bootstrap: [RemoteDesktopComponent],
    providers: [{provide: LocationStrategy, useClass: PathLocationStrategy}, {
        provide: HAMMER_GESTURE_CONFIG,
        useClass: HammerConfig
    }],
})
export class VirtualDesktopModule {
}
