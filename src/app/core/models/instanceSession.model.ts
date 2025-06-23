import {JsonObject, JsonProperty} from 'json2typescript';

@JsonObject('InstanceSession')
export class InstanceSession {

    @JsonProperty('id', Number)
    private _id: number = undefined;

    @JsonProperty('connectionId', String)
    private _connectionId: string = undefined;

    @JsonProperty('instanceId', Number)
    private _instanceId: number = undefined;

    @JsonProperty('current', Boolean)
    private _current: boolean = undefined;

    @JsonProperty('protocol', String)
    private _protocol: string = undefined;

    public copy(data: InstanceSession): InstanceSession {
        this.id = data.id;
        this.connectionId = data.connectionId;
        this.instanceId = data.instanceId;
        this.current = data.current;
        this.protocol = data.protocol;
        return this;
    }

    public get id(): number {
        return this._id;
    }

    public set id(value: number) {
        this._id = value;
    }

    public get connectionId(): string {
        return this._connectionId;
    }

    public set connectionId(value: string) {
        this._connectionId = value;
    }

    public get instanceId(): number {
        return this._instanceId;
    }

    public set instanceId(value: number) {
        this._instanceId = value;
    }

    public get current(): boolean {
        return this._current;
    }

    public set current(value: boolean) {
        this._current = value;
    }

    public get protocol(): string {
        return this._protocol;
    }

    public set protocol(value: string) {
        this._protocol = value;
    }
}
