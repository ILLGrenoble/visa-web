import {JsonObject, JsonProperty} from 'json2typescript';

@JsonObject('Flavour')
export class Flavour {

    @JsonProperty('id', Number, true)
    private _id: number = undefined;

    @JsonProperty('name', String)
    private _name: string = undefined;

    @JsonProperty('memory', Number)
    private _memory: number = undefined;

    @JsonProperty('computeId', String, true)
    private _computeId: string = undefined;

    @JsonProperty('cpu', Number)
    private _cpu: number = undefined;

    @JsonProperty('credits', Number)
    private _credits: number = undefined;

    constructor() {

    }

    public copy(data: Flavour): Flavour {
        this.id = data.id;
        this.name = data.name;
        this.memory = data.memory;
        this.cpu = data.cpu;
        this.computeId = data.computeId;

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

    public get memory(): number {
        return this._memory;
    }

    public set memory(value: number) {
        this._memory = value;
    }

    public get cpu(): number {
        return this._cpu;
    }

    public set cpu(value: number) {
        this._cpu = value;
    }

    get credits(): number {
        return this._credits;
    }

    set credits(value: number) {
        this._credits = value;
    }

    public get computeId(): string {
        return this._computeId;
    }

    public set computeId(value: string) {
        this._computeId = value;
    }

}
