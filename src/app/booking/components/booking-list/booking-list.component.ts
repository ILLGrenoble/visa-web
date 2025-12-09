import {Component, Input} from '@angular/core';

@Component({
    selector: 'visa-booking-list',
    templateUrl: './booking-list.component.html',
    styleUrls: ['./booking-list.component.scss'],
})
export class BookingListComponent {

    private _bookings: any[] = [];

    @Input('bookings')
    set bookings(bookings: any[]) {
        this._bookings = bookings;
    }

    get bookings(): any[] {
        return this._bookings;
    }
}
