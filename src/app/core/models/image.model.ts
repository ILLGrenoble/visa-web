import {JsonObject, JsonProperty} from 'json2typescript';
import {Protocol} from './protocol.model';

@JsonObject('Image')
export class Image {

    @JsonProperty('id', Number, true)
    private _id: number = undefined;

    @JsonProperty('name', String)
    private _name: string = undefined;

    @JsonProperty('version', String)
    private _version: string = undefined;

    @JsonProperty('description', String)
    private _description: string = undefined;

    @JsonProperty('icon', String)
    private _icon: string = undefined;

    @JsonProperty('computeId', String, true)
    private _computeId: string = undefined;

    @JsonProperty('protocols', [Protocol], true)
    private _protocols: Protocol[] = undefined;

    @JsonProperty('visible', Boolean, true)
    private _visible: boolean = undefined;

    @JsonProperty('bootCommand', String, true)
    private _bootCommand: string = undefined;

    @JsonProperty('autologin', String, true)
    private _autologin: string = undefined;

    @JsonProperty('deleted', Boolean, true)
    private _deleted: boolean = undefined;

    public copy(data: Image): Image {
        this.id = data.id;
        this.name = data.name;
        this.description = data.description;
        this.version = data.version;
        this.icon = data.icon;
        this.computeId = data.computeId;
        this.protocols = data.protocols;
        this.visible = data.visible;
        this.deleted = data.deleted;
        this.bootCommand = data.bootCommand;
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

    public get version(): string {
        return this._version;
    }

    public set version(value: string) {
        this._version = value;
    }

    public get description(): string {
        return this._description;
    }

    public set description(value: string) {
        this._description = value;
    }

    public get icon(): string {
        return this._icon;
    }

    public set icon(value: string) {
        this._icon = value;
    }

    public get computeId(): string {
        return this._computeId;
    }

    public set computeId(value: string) {
        this._computeId = value;
    }

    public get protocols(): Protocol[] {
        return this._protocols;
    }

    public set protocols(value: Protocol[]) {
        this._protocols = value;
    }

    public get visible(): boolean {
        return this._visible;
    }

    public set visible(value: boolean) {
        this._visible = value;
    }

    public get bootCommand(): string {
        return this._version;
    }

    public set bootCommand(value: string) {
        this._bootCommand = value;
    }

    public get autologin(): string {
        return this._autologin;
    }

    public set autologin(value: string) {
        this._autologin = value;
    }

    public get deleted(): boolean {
        return this._deleted;
    }

    public set deleted(value: boolean) {
        this._deleted = value;
    }

    public hasProtocolWithName(protocolName: string): boolean {
        return this._protocols.map(protocol => protocol.name).includes(protocolName);
    }

}
