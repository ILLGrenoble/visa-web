import {JsonObject, JsonProperty} from 'json2typescript';

@JsonObject('CloudImage')
export class CloudImage {

    @JsonProperty('id', String)
    private _id: string = undefined;

    @JsonProperty('name', String)
    private _name: string = undefined;

    public copy(data: CloudImage): CloudImage {
        this.id = data.id;
        this.name = data.name;
        return this;
    }

    public get id(): string {
        return this._id;
    }

    public set id(value: string) {
        this._id = value;
    }

    public get name(): string {
        return this._name;
    }

    public set name(value: string) {
        this._name = value;
    }
}
