import {JsonConverter, JsonCustomConvert, JsonObject, JsonProperty} from 'json2typescript';

@JsonConverter
class DateConverter implements JsonCustomConvert<Date> {
    public serialize(date: Date): any {
        return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' +  date.getDate();
    }
    public deserialize(date: any): Date {
        return new Date(date);
    }
}

@JsonObject('SystemNotification')
export class SystemNotification {

    @JsonProperty('id', Number)
    private _id: number = undefined;

    @JsonProperty('uid', Number)
    private _uid: number = undefined;

    @JsonProperty('message', String)
    private _message: string = undefined;

    @JsonProperty('level', String)
    private _level: string = undefined;

    @JsonProperty('createdAt', DateConverter)
    private _createdAt: string = undefined;

    get id(): number{
        return this._id;
    }

    get uid(): number {
        return this._uid;
    }

    get message(): string {
        return this._message;
    }

    set message(value: string) {
        this._message = value;
    }

    get level(): string {
        return this._level;
    }

    set level(value: string) {
        this._level = value;
    }

    get createdAt(): string {
        return this._createdAt;
    }

    set createdAt(value: string) {
        this._createdAt = value;
    }

    constructor() {
    }

}
