import {JsonObject, JsonProperty} from 'json2typescript';

@JsonObject('DevicePool')
export class DevicePool {

    @JsonProperty('id', Number, true)
    private _id: number = undefined;

    @JsonProperty('name', String)
    private _name: string = undefined;

    @JsonProperty('description', String)
    private _description: string = undefined;

    public copy(data: DevicePool): DevicePool {
        this._id = data.id;
        this._name = data.name;
        this._description = data.description;

        return this;
    }

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

    get description(): string {
        return this._description;
    }

    set description(value: string) {
        this._description = value;
    }

}
