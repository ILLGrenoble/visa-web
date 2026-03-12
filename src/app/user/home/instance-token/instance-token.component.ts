import {Component, Input} from '@angular/core';
import {Router} from '@angular/router';
import {BookingToken, Flavour} from "@core";
import {BookingRequestSimple} from "../../../core/models/booking-request-simple.model";

@Component({
    selector: 'visa-instance-token',
    styleUrls: ['./instance-token.component.scss'],
    templateUrl: './instance-token.component.html',
})
export class InstanceTokenComponent {

    private _token: BookingToken;

    get token(): BookingToken {
        return this._token;
    }

    @Input()
    set token(value: BookingToken) {
        this._token = value;
    }

    get booking(): BookingRequestSimple {
        return this._token.bookingRequest;
    }

    get flavour(): Flavour {
        return this._token.flavour;
    }

    get tokenActive(): boolean {
        const now = Date.now();
        return now > this.booking.startTime.getTime() && now < this.booking.endTime.getTime();
    }

    constructor(private router: Router) {

    }

    protected getCpuView(flavour: Flavour): string {
        return flavour.cpu + ' Core' + (flavour.cpu !== 1 ? 's' : '');
    }

    protected getRamView(flavour: Flavour): string {
        return (Math.round(flavour.memory / 1024 * 10) / 10) + 'GB';
    }
}
