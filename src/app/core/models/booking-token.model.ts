import {JsonObject, JsonProperty} from 'json2typescript';
import {Flavour} from "./flavour.model";
import {User} from "./user.model";
import {BookingRequestSimple} from "./booking-request-simple.model";

@JsonObject('BookingToken')
export class BookingToken {
    @JsonProperty('id', Number, true)
    private _id: number = undefined;

    @JsonProperty('uid', String)
    private _uid: string = undefined;

    @JsonProperty('bookingRequest', BookingRequestSimple)
    private _bookingRequest: BookingRequestSimple = undefined;

    @JsonProperty('flavour', Flavour)
    private _flavour: Flavour = undefined;

    @JsonProperty('owner', User)
    private _owner: User = undefined;

    @JsonProperty('instanceId', Number)
    private _instanceId: number = undefined;


    get id(): number {
        return this._id;
    }

    set id(value: number) {
        this._id = value;
    }

    get uid(): string {
        return this._uid;
    }

    set uid(value: string) {
        this._uid = value;
    }

    get bookingRequest(): BookingRequestSimple {
        return this._bookingRequest;
    }

    set bookingRequest(value: BookingRequestSimple) {
        this._bookingRequest = value;
    }

    get flavour(): Flavour {
        return this._flavour;
    }

    set flavour(value: Flavour) {
        this._flavour = value;
    }

    get owner(): User {
        return this._owner;
    }

    set owner(value: User) {
        this._owner = value;
    }

    get instanceId(): number {
        return this._instanceId;
    }

    set instanceId(value: number) {
        this._instanceId = value;
    }
}

