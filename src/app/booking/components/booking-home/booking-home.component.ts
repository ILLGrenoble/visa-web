import {Component} from '@angular/core';

@Component({
    selector: 'visa-booking-home',
    templateUrl: './booking-home.component.html',
    styleUrls: ['./booking-home.component.scss'],
})
export class BookingHomeComponent {

    private _bookings: [] = [];


    get bookings(): [] {
        return this._bookings;
    }
}
