import {JsonObject, JsonProperty} from 'json2typescript';

@JsonObject('Protocol')
export class Protocol {

    @JsonProperty('id', Number, true)
    private _id: number = undefined;

    @JsonProperty('name', String)
    private _name: string = undefined;

    public copy(data: Protocol): Protocol {
        this.id = data.id;
        this.name = data.name;
        return this;
    }

    public get id(): number {
        return this._id;
    }

    public set id(value: number) {
        this._id = value;
    }

    public get name(): string {
        return this._name;
    }

    public set name(value: string) {
        this._name = value;
    }
}
