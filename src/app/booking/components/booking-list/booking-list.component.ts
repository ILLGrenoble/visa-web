import {Component, Input} from '@angular/core';
import {BookingRequest} from "../../../core";

@Component({
    selector: 'visa-booking-list',
    templateUrl: './booking-list.component.html',
    styleUrls: ['./booking-list.component.scss'],
})
export class BookingListComponent {

    private _bookings: BookingRequest[] = [];

    @Input('bookings')
    set bookings(bookings: BookingRequest[]) {
        this._bookings = bookings;
    }

    get bookings(): BookingRequest[] {
        return this._bookings;
    }
}
