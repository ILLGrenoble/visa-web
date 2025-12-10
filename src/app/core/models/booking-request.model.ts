import {JsonConverter, JsonCustomConvert, JsonObject, JsonProperty} from 'json2typescript';
import {Flavour} from "./flavour.model";
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

@JsonObject('BookingFlavourRequest')
export class BookingFlavourRequest {

    @JsonProperty('id', Number, true)
    private _id: number = undefined;

    @JsonProperty('flavour', Flavour)
    private _flavour: Flavour = undefined;

    @JsonProperty('quantity', Number)
    private _quantity: number = undefined;


    get id(): number {
        return this._id;
    }

    set id(value: number) {
        this._id = value;
    }
    get flavour(): Flavour {
        return this._flavour;
    }

    set flavour(value: Flavour) {
        this._flavour = value;
    }

    get quantity(): number {
        return this._quantity;
    }

    set quantity(value: number) {
        this._quantity = value;
    }

}

@JsonObject('BookingFlavourHistory')
export class BookingFlavourHistory {

    @JsonProperty('id', Number, true)
    private _id: number = undefined;

    @JsonProperty('actor', User)
    private _actor: User = undefined;

    @JsonProperty('state', String)
    private _state: string = undefined;

    @JsonProperty('date', DateConverter)
    private _date: Date = undefined;

    @JsonProperty('comments', String)
    private _comments: string = undefined;

    get id(): number {
        return this._id;
    }

    set id(value: number) {
        this._id = value;
    }

    get actor(): User {
        return this._actor;
    }

    set actor(value: User) {
        this._actor = value;
    }

    get state(): string {
        return this._state;
    }

    set state(value: string) {
        this._state = value;
    }

    get date(): Date {
        return this._date;
    }

    set date(value: Date) {
        this._date = value;
    }

    get comments(): string {
        return this._comments;
    }

    set comments(value: string) {
        this._comments = value;
    }
}

@JsonObject('BookingRequest')
export class BookingRequest {
    @JsonProperty('id', Number, true)
    private _id: number = undefined;

    @JsonProperty('createdAt', DateConverter)
    private _createdAt: Date = undefined;

    @JsonProperty('startDate', DateConverter)
    private _startDate: Date = undefined;

    @JsonProperty('endDate', DateConverter)
    private _endDate: Date = undefined;

    @JsonProperty('owner', User)
    private _owner: User = undefined;

    @JsonProperty('state', String)
    private _state: string = undefined;

    @JsonProperty('flavours', [BookingFlavourRequest])
    private _flavours: BookingFlavourRequest[] = undefined;

    @JsonProperty('history', [BookingFlavourHistory])
    private _history: BookingFlavourHistory[] = undefined;


    get id(): number {
        return this._id;
    }

    set id(value: number) {
        this._id = value;
    }

    get createdAt(): Date {
        return this._createdAt;
    }

    set createdAt(value: Date) {
        this._createdAt = value;
    }

    get startDate(): Date {
        return this._startDate;
    }

    set startDate(value: Date) {
        this._startDate = value;
    }

    get endDate(): Date {
        return this._endDate;
    }

    set endDate(value: Date) {
        this._endDate = value;
    }

    get owner(): User {
        return this._owner;
    }

    set owner(value: User) {
        this._owner = value;
    }

    get state(): string {
        return this._state;
    }

    set state(value: string) {
        this._state = value;
    }

    get flavours(): BookingFlavourRequest[] {
        return this._flavours;
    }

    set flavours(value: BookingFlavourRequest[]) {
        this._flavours = value;
    }

    get history(): BookingFlavourHistory[] {
        return this._history;
    }

    set history(value: BookingFlavourHistory[]) {
        this._history = value;
    }
}

