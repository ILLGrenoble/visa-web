import {JsonObject, JsonProperty} from 'json2typescript';
import {Flavour} from "./flavour.model";
import {User} from "./user.model";
import {BookingRequestSimple} from "./booking-request-simple.model";
import {Plan} from "./plan.model";
import {Member} from "./member.model";

@JsonObject('BookingTokenInstance')
export class BookingTokenInstance {

    @JsonProperty('id', Number, true)
    private _id: number = undefined;

    @JsonProperty('uid', String)
    private _uid: string = undefined;

    @JsonProperty('name', String)
    private _name: string = undefined;

    @JsonProperty('createdAt', String)
    private _createdAt: string = undefined;

    @JsonProperty('plan', Plan)
    private _plan: Plan = undefined;

    @JsonProperty('state', String)
    private _state: string = undefined;

    @JsonProperty('membership', Member)
    private _membership?: Member = undefined;

    @JsonProperty('canConnectWhileOwnerAway', Boolean, true)
    private _canConnectWhileOwnerAway: boolean = undefined;

    @JsonProperty('unrestrictedAccess', Boolean, true)
    private _unrestrictedAccess: boolean = undefined;

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

    get name(): string {
        return this._name;
    }

    set name(value: string) {
        this._name = value;
    }

    get createdAt(): string {
        return this._createdAt;
    }

    set createdAt(value: string) {
        this._createdAt = value;
    }

    get plan(): Plan {
        return this._plan;
    }

    set plan(value: Plan) {
        this._plan = value;
    }

    get state(): string {
        return this._state;
    }

    set state(value: string) {
        this._state = value;
    }

    get membership(): Member {
        return this._membership;
    }

    set membership(value: Member) {
        this._membership = value;
    }

    get canConnectWhileOwnerAway(): boolean {
        return this._canConnectWhileOwnerAway;
    }

    set canConnectWhileOwnerAway(value: boolean) {
        this._canConnectWhileOwnerAway = value;
    }

    get unrestrictedAccess(): boolean {
        return this._unrestrictedAccess;
    }

    set unrestrictedAccess(value: boolean) {
        this._unrestrictedAccess = value;
    }
}

@JsonObject('BookingToken')
export class BookingToken {
    @JsonProperty('id', Number, true)
    private _id: number = undefined;

    @JsonProperty('uid', String)
    private _uid: string = undefined;

    @JsonProperty('bookingRequest', BookingRequestSimple)
    private _bookingRequest: BookingRequestSimple = undefined;

    @JsonProperty('flavour', Flavour)
    private _flavour: Flavour = undefined;

    @JsonProperty('owner', User)
    private _owner: User = undefined;

    @JsonProperty('instance', BookingTokenInstance)
    private _instance: BookingTokenInstance = undefined;


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

    get bookingRequest(): BookingRequestSimple {
        return this._bookingRequest;
    }

    set bookingRequest(value: BookingRequestSimple) {
        this._bookingRequest = value;
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

    get instance(): BookingTokenInstance {
        return this._instance;
    }

    set instance(value: BookingTokenInstance) {
        this._instance = value;
    }
}

