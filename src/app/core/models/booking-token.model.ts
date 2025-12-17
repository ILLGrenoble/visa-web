import {JsonConverter, JsonCustomConvert, JsonObject, JsonProperty} from 'json2typescript';
import {Flavour} from "./flavour.model";
import {User} from "./user.model";
import {Instance} from "./instance.model";

@JsonObject('BookingToken')
export class BookingToken {
    @JsonProperty('id', Number, true)
    private _id: number = undefined;

    @JsonProperty('uid', String)
    private _uid: string = undefined;

    @JsonProperty('flavour', Flavour)
    private _flavour: Flavour = undefined;

    @JsonProperty('owner', User)
    private _owner: User = undefined;

    @JsonProperty('instance', Instance)
    private _instance: Instance = undefined;


    get id(): number {
        return this._id;
    }

    set id(value: number) {
        this._id = value;
    }

    get uid(): string {
        return this._uid;
    }

    set uid(value: string) {
        this._uid = value;
    }

    get flavour(): Flavour {
        return this._flavour;
    }

    set flavour(value: Flavour) {
        this._flavour = value;
    }

    get owner(): User {
        return this._owner;
    }

    set owner(value: User) {
        this._owner = value;
    }

    get instance(): Instance {
        return this._instance;
    }

    set instance(value: Instance) {
        this._instance = value;
    }
}

