import {JsonObject, JsonProperty} from 'json2typescript';

@JsonObject('ClientNotification')
export class ClientNotification {

    @JsonProperty('tag', String)
    private _tag: string = undefined;

    @JsonProperty('count', Number)
    private _count: number = undefined;

    get tag(): string {
        return this._tag;
    }

    set tag(value: string) {
        this._tag = value;
    }

    get count(): number {
        return this._count;
    }

    set count(value: number) {
        this._count = value;
    }

}
