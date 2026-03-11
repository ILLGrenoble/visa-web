import {JsonObject, JsonProperty} from 'json2typescript';
import {Flavour} from "./flavour.model";


@JsonObject('BookingFlavourConfiguration')
export class BookingFlavourConfiguration {

    @JsonProperty('autoAccept', Boolean)
    private _autoAccept: Boolean = undefined;

    @JsonProperty('flavour', Flavour)
    private _flavour: Flavour = undefined;

    @JsonProperty('maxInstances', Number)
    private _maxInstances: number = undefined;

    @JsonProperty('maxReservationDays', Number)
    private _maxReservationDays: number = undefined;

    get flavour(): Flavour {
        return this._flavour;
    }

    set flavour(value: Flavour) {
        this._flavour = value;
    }

    get autoAccept(): Boolean {
        return this._autoAccept;
    }

    set autoAccept(value: Boolean) {
        this._autoAccept = value;
    }

    get maxInstances(): number {
        return this._maxInstances;
    }

    set maxInstances(value: number) {
        this._maxInstances = value;
    }

    get maxReservationDays(): number {
        return this._maxReservationDays;
    }

    set maxReservationDays(value: number) {
        this._maxReservationDays = value;
    }
}
