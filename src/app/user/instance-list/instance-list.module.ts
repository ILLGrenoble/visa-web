import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {SharedModule} from '@shared';
import {CardComponent} from './card';
import {DetailsDialog, ExperimentsDialog, MembersDialog, RequestExtensionDialog} from './dialogs';
import {ListComponent} from './list';

@NgModule({
    imports: [
        CommonModule,
        SharedModule,
    ],
    declarations: [
        CardComponent,
        ListComponent,
        DetailsDialog,
        MembersDialog,
        ExperimentsDialog,
        RequestExtensionDialog,
    ],
    exports: [
        CardComponent,
        ListComponent,

    ],
    entryComponents: [
        DetailsDialog,
        MembersDialog,
        ExperimentsDialog,
        RequestExtensionDialog,
    ],
})
export class InstanceListModule {

}
