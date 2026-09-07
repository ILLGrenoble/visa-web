import {JsonObject, JsonProperty} from 'json2typescript';


@JsonObject('AccountBookingAccess')
export class AccountBookingAccess {

    @JsonProperty('owner', Boolean)
    private _owner: boolean = undefined;

    @JsonProperty('organiser', Boolean)
    private _organiser: boolean = undefined;

    get owner(): boolean {
        return this._owner;
    }

    get organiser(): boolean {
        return this._organiser;
    }

}
