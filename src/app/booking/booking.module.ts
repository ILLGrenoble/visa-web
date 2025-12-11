import {SharedModule} from '@shared';
import {NgModule} from '@angular/core';
import {ROUTING} from './booking.routing';
import {BookingCardComponent, BookingHomeComponent, BookingListComponent, BookingNewComponent} from './components';
import {ClrCheckboxModule, ClrCommonFormsModule, ClrInputModule, ClrModalModule, ClrSpinnerModule} from "@clr/angular";
import {ReactiveFormsModule} from "@angular/forms";
import {DatePipe, NgIf} from "@angular/common";

@NgModule({
    imports: [
        SharedModule,
        ROUTING,
        ClrCheckboxModule,
        ClrCommonFormsModule,
        ClrInputModule,
        ReactiveFormsModule,
        NgIf,
        ClrModalModule,
        ClrSpinnerModule,
        DatePipe
    ],
    declarations: [
        BookingHomeComponent,
        BookingListComponent,
        BookingNewComponent,
        BookingCardComponent,
    ],
    exports: [
        BookingHomeComponent,
        BookingListComponent,
        BookingNewComponent,
        BookingCardComponent,
    ]
})
export class BookingModule {


}
