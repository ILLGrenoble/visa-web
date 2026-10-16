import {JsonObject, JsonProperty} from 'json2typescript';

@JsonObject('ConnectedUser')
export class ConnectedUser {

    @JsonProperty('userId', Number)
    private _userId: number = undefined;

    @JsonProperty('fullName', String)
    private _fullName: string = undefined;

    @JsonProperty('role', String)
    private _role: string = undefined;


    get userId(): number {
        return this._userId;
    }

    set userId(value: number) {
        this._userId = value;
    }

    get fullName(): string {
        return this._fullName;
    }

    set fullName(value: string) {
        this._fullName = value;
    }

    get role(): string {
        return this._role;
    }

    set role(value: string) {
        this._role = value;
    }
}
