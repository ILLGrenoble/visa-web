import {Component, Input} from '@angular/core';
import {BookingRequest} from "../../../core/graphql";

@Component({
    selector: 'visa-admin-booking-request-list',
    templateUrl: './booking-request-list.component.html',
    styleUrls: ['./booking-request-list.component.scss'],
})
export class BookingRequestListComponent {

    private _bookingRequests: BookingRequest[];

    get bookingRequests(): BookingRequest[] {
        return this._bookingRequests;
    }

    @Input()
    set bookingRequests(value: BookingRequest[]) {
        this._bookingRequests = value;
    }

    constructor() {
    }

}
