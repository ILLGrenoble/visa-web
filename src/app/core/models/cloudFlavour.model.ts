import {JsonObject, JsonProperty} from 'json2typescript';

@JsonObject('CloudFlavour')
export class CloudFlavour {

    @JsonProperty('id', String)
    private _id: string = undefined;

    @JsonProperty('name', String)
    private _name: string = undefined;

    @JsonProperty('disk', Number)
    private _disk: number = undefined;

    @JsonProperty('cpus', Number)
    private _cpus: number = undefined;

    @JsonProperty('ram', Number)
    private _ram: number = undefined;

    constructor() {

    }

    public copy(data: CloudFlavour): CloudFlavour {
        this.id = data.id;
        this.name = data.name;
        this.cpus = data.cpus;
        this.ram = data.ram;
        this.disk = data.disk;
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

    public get cpus(): number {
        return this._cpus;
    }

    public set cpus(value: number) {
        this._cpus = value;
    }

    public get disk(): number {
        return this._disk;
    }

    public set disk(value: number) {
        this._disk = value;
    }

    public get ram(): number {
        return this._ram;
    }

    public set ram(value: number) {
        this._ram = value;
    }

}
