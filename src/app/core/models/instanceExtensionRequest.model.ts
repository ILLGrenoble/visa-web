import {JsonObject, JsonProperty} from 'json2typescript';

@JsonObject('InstanceExtensionRequest')
export class InstanceExtensionRequest {

    @JsonProperty('id', Number)
    private _id: number = undefined;

    @JsonProperty('comments', String)
    private _comments: string = undefined;

    @JsonProperty('createdAt', String)
    private _createdAt: string = undefined;

    public get id(): number {
        return this._id;
    }

    public set id(value: number) {
        this._id = value;
    }

    get comments(): string {
        return this._comments;
    }

    set comments(value: string) {
        this._comments = value;
    }

    get createdAt(): string {
        return this._createdAt;
    }

    set createdAt(value: string) {
        this._createdAt = value;
    }
}
