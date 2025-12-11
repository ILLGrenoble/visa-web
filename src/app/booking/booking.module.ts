import {SharedModule} from '@shared';
import {NgModule} from '@angular/core';
import {ROUTING} from './booking.routing';
import {
    BookingCardComponent,
    BookingDetailsComponent,
    BookingHomeComponent,
    BookingListComponent,
    BookingNewComponent
} from './components';
import {ClrCheckboxModule, ClrCommonFormsModule, ClrInputModule, ClrModalModule, ClrSpinnerModule} from "@clr/angular";
import {ReactiveFormsModule} from "@angular/forms";
import {DatePipe, LowerCasePipe, NgIf, TitleCasePipe} from "@angular/common";

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
        DatePipe,
        LowerCasePipe,
        TitleCasePipe
    ],
    declarations: [
        BookingHomeComponent,
        BookingListComponent,
        BookingNewComponent,
        BookingCardComponent,
        BookingDetailsComponent,
    ],
    exports: [
        BookingHomeComponent,
        BookingListComponent,
        BookingNewComponent,
        BookingCardComponent,
        BookingDetailsComponent,
    ]
})
export class BookingModule {


}
