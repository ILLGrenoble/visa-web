import {JsonObject, JsonProperty} from 'json2typescript';
import {BookingRequest} from "./booking-request.model";


@JsonObject('AccountBookingRequests')
export class AccountBookingRequests {

    @JsonProperty('ownerBookingRequests', [BookingRequest])
    private _ownerBookingRequests: BookingRequest[] = undefined;

    @JsonProperty('organiserBookingRequests', [BookingRequest])
    private _organiserBookingRequests: BookingRequest[] = undefined;

    get ownerBookingRequests(): BookingRequest[] {
        return this._ownerBookingRequests;
    }

    get organiserBookingRequests(): BookingRequest[] {
        return this._organiserBookingRequests;
    }

}
