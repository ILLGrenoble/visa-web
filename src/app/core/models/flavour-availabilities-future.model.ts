import {JsonConverter, JsonCustomConvert, JsonObject, JsonProperty} from 'json2typescript';
import {Flavour} from "./flavour.model";

@JsonConverter
class DateConverter implements JsonCustomConvert<Date> {
    public serialize(date: Date): any {
        return  date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
    }

    public deserialize(date: any): Date {
        return date == null ? null : new Date(date);
    }
}

@JsonObject('FlavourAvailability')
export class FlavourAvailability {

    @JsonProperty('date', DateConverter)
    private _date: Date = undefined;

    @JsonProperty('availableUnits', Number)
    private _availableUnits: number = undefined;

    @JsonProperty('totalUnits', Number)
    private _totalUnits: number = undefined;

    get date(): Date {
        return this._date;
    }

    set date(value: Date) {
        this._date = value;
    }

    get availableUnits(): number {
        return this._availableUnits;
    }

    set availableUnits(value: number) {
        this._availableUnits = value;
    }

    get totalUnits(): number {
        return this._totalUnits;
    }

    set totalUnits(value: number) {
        this._totalUnits = value;
    }
}


@JsonObject('FlavourAvailabilitiesFuture')
export class FlavourAvailabilitiesFuture {

    @JsonProperty('flavour', Flavour)
    private _flavour: Flavour = undefined;

    @JsonProperty('confidence', String)
    private _confidence: string = undefined;

    @JsonProperty('availabilities', [FlavourAvailability])
    private _availabilities: FlavourAvailability[] = undefined;

    get flavour(): Flavour {
        return this._flavour;
    }

    set flavour(value: Flavour) {
        this._flavour = value;
    }

    get confidence(): string {
        return this._confidence;
    }

    set confidence(value: string) {
        this._confidence = value;
    }

    get availabilities(): FlavourAvailability[] {
        return this._availabilities;
    }

    set availabilities(value: FlavourAvailability[]) {
        this._availabilities = value;
    }
}
