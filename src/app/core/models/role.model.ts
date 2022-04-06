import {JsonConverter, JsonCustomConvert, JsonObject, JsonProperty} from 'json2typescript';

@JsonConverter
class DateConverter implements JsonCustomConvert<Date> {
    public serialize(date: Date): any {
        return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
    }

    public deserialize(date: any): Date {
        if (date == null) {
            return null;
        }
        return new Date(date);
    }
}

@JsonObject('Role')
export class Role {

    @JsonProperty('name', String)
    private _name: string = undefined;

    @JsonProperty('expiresAt', DateConverter)
    private _expiresAt: Date = undefined;

    constructor() {
    }

    get name(): string {
        return this._name;
    }

    set name(value: string) {
        this._name = value;
    }

    get expiresAt(): Date {
        return this._expiresAt;
    }

    set expiresAt(value: Date) {
        this._expiresAt = value;
    }
}
