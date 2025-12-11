import {Component, Input} from '@angular/core';
import {BookingRequest, Flavour} from "../../../core";

@Component({
    selector: 'visa-booking-card',
    templateUrl: './booking-card.component.html',
    styleUrls: ['./booking-card.component.scss'],
})
export class BookingCardComponent {

    private _booking: BookingRequest;

    @Input('booking')
    set bookings(booking: BookingRequest) {
        this._booking = booking;
    }

    get booking(): BookingRequest {
        return this._booking;
    }

    get bookingStatus(): string {
        if (this._booking.state == 'CREATED') {
            return 'The request is pending approval';
        } else if (this._booking.state == 'ACCEPTED') {
            // Check dates to see if active
            return 'The request has been accepted';
        } else if (this._booking.state == 'REFUSED') {
            return 'The request has been refused';
        }
    }

    constructor() {
    }

    protected getCpuView(flavour: Flavour): string {
        return flavour.cpu + ' Core' + (flavour.cpu !== 1 ? 's' : '');
    }

    protected getRamView(flavour: Flavour): string {
        return (Math.round(flavour.memory / 1024 * 10) / 10) + 'GB';
    }
}
