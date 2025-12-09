import {SharedModule} from '@shared';
import {NgModule} from '@angular/core';
import {ROUTING} from './booking.routing';
import {BookingHomeComponent, BookingListComponent, BookingNewComponent} from './components';
import {ClrCheckboxModule, ClrCommonFormsModule, ClrInputModule} from "@clr/angular";
import {ReactiveFormsModule} from "@angular/forms";
import {NgIf} from "@angular/common";

@NgModule({
    imports: [
        SharedModule,
        ROUTING,
        ClrCheckboxModule,
        ClrCommonFormsModule,
        ClrInputModule,
        ReactiveFormsModule,
        NgIf
    ],
    declarations: [
        BookingHomeComponent,
        BookingListComponent,
        BookingNewComponent,
    ],
    exports: [
        BookingHomeComponent,
        BookingListComponent,
        BookingNewComponent,
    ]
})
export class BookingModule {


}
