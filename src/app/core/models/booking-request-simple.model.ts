import {JsonConverter, JsonCustomConvert, JsonObject, JsonProperty} from 'json2typescript';
import {User} from "./user.model";

@JsonConverter
class DateConverter implements JsonCustomConvert<Date> {
    public serialize(date: Date): any {
        return  date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
    }

    public deserialize(date: any): Date {
        return date == null ? null : new Date(date);
    }
}

@JsonObject('BookingRequestSimple')
export class BookingRequestSimple {
    @JsonProperty('id', Number, true)
    private _id: number = undefined;

    @JsonProperty('name', String)
    private _name: string = undefined;

    @JsonProperty('startDate', DateConverter)
    private _startDate: Date = undefined;

    @JsonProperty('endDate', DateConverter)
    private _endDate: Date = undefined;

    @JsonProperty('owner', User)
    private _owner: User = undefined;

    get id(): number {
        return this._id;
    }

    set id(value: number) {
        this._id = value;
    }

    get name(): string {
        return this._name;
    }

    set name(value: string) {
        this._name = value;
    }

    get startDate(): Date {
        return this._startDate;
    }

    set startDate(value: Date) {
        this._startDate = value;
    }

    get startTime(): Date {
        return this._startDate;
    }

    get endDate(): Date {
        return this._endDate;
    }

    set endDate(value: Date) {
        this._endDate = value;
    }

    get endTime(): Date {
        return this._endDate ? new Date(this._endDate.getTime() + 24 * 60 * 60 * 1000) : null;
    }

    get owner(): User {
        return this._owner;
    }

    set owner(value: User) {
        this._owner = value;
    }
}

