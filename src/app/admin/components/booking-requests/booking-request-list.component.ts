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

    public creationComment(bookingRequest: BookingRequest) {
        return bookingRequest.history.find(history => history.state === 'CREATED')?.comments;
    }

    public getCSSFromState(bookingRequest: BookingRequest) {
        if (bookingRequest.state === 'CREATED') {
            return 'booking-request-list-row-pending';
        } else if (bookingRequest.state === 'ACCEPTED') {
            if (new Date(bookingRequest.startDate).getTime() <= new Date().getTime() && new Date(bookingRequest.endDate).getTime() >= new Date().getTime()) {
                return 'booking-request-list-row-active';

            } else {
                return 'booking-request-list-row-accepted';
            }
        }
    }

}
