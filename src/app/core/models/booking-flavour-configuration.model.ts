import {JsonObject, JsonProperty} from 'json2typescript';
import {Flavour} from "./flavour.model";


@JsonObject('BookingFlavourConfiguration')
export class BookingFlavourConfiguration {

    @JsonProperty('flavour', Flavour)
    private _flavour: Flavour = undefined;

    @JsonProperty('maxInstances', Number)
    private _maxInstances: number = undefined;

    @JsonProperty('maxReservationDays', Number)
    private _maxReservationDays: number = undefined;

    @JsonProperty('maxDaysInAdvance', Number)
    private _maxDaysInAdvance: number = undefined;

    get flavour(): Flavour {
        return this._flavour;
    }

    set flavour(value: Flavour) {
        this._flavour = value;
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

    get maxDaysInAdvance(): number {
        return this._maxDaysInAdvance;
    }

    set maxDaysInAdvance(value: number) {
        this._maxDaysInAdvance = value;
    }
}
