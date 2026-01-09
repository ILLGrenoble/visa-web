import {Component, Input} from '@angular/core';
import {BookingRequest, Flavour} from "../../../core/graphql";

@Component({
    selector: 'visa-admin-booking-request-card',
    templateUrl: './booking-request-card.component.html',
    styleUrls: ['./booking-request-card.component.scss'],
})
export class BookingRequestCardComponent {

    private _bookingRequest: BookingRequest;

    get bookingRequest(): BookingRequest {
        return this._bookingRequest;
    }

    @Input()
    set bookingRequest(value: BookingRequest) {
        this._bookingRequest = value;
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
