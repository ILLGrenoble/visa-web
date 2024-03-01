import {JsonObject, JsonProperty} from 'json2typescript';
import {Instance} from './instance.model';

@JsonObject('InstanceSession')
export class InstanceSession {

    @JsonProperty('id', Number)
    private _id: number = undefined;

    @JsonProperty('instance', Instance)
    private _instance: Instance = undefined;

    @JsonProperty('current', Boolean)
    private _current: boolean = undefined;

    public copy(data: InstanceSession): InstanceSession {
        this.id = data.id;
        this.instance = data.instance;
        this.current = data.current;
        return this;
    }

    public get id(): number {
        return this._id;
    }

    public set id(value: number) {
        this._id = value;
    }

    public get instance(): Instance {
        return this._instance;
    }

    public set instance(value: Instance) {
        this._instance = value;
    }

    public get current(): boolean {
        return this._current;
    }

    public set current(value: boolean) {
        this._current = value;
    }

}
