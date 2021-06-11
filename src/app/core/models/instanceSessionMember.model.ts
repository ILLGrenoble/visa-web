import {JsonObject, JsonProperty} from 'json2typescript';
import {InstanceSession} from './instanceSession.model';
import {User} from './user.model';

@JsonObject('InstanceSessionMember')
export class InstanceSessionMember {

    @JsonProperty('id', Number)
    private _id: number = undefined;

    @JsonProperty('createdAt', String)
    private _createdAt: string = undefined;

    @JsonProperty('instanceSession', InstanceSession)
    private _instanceSession: InstanceSession = undefined;

    @JsonProperty('sessionId', String)
    private _sessionId: string = undefined;

    @JsonProperty('user', User)
    private _user: User = undefined;

    @JsonProperty('role', String)
    private _role: string = undefined;

    @JsonProperty('active', Boolean)
    private _active: boolean = undefined;

    constructor() {

    }

    public copy(data: InstanceSessionMember): InstanceSessionMember {
        this.id = data.id;
        this.createdAt = data.createdAt;
        this.instanceSession = data.instanceSession;
        this.sessionId = data.sessionId;
        this.user = data.user;
        this.role = data.role;
        this.active = data.active;
        return this;
    }

    public get id(): number {
        return this._id;
    }

    public set id(value: number) {
        this._id = value;
    }

    public get createdAt(): string {
        return this._createdAt;
    }

    public set createdAt(value: string) {
        this._createdAt = value;
    }

    public get instanceSession(): InstanceSession {
        return this._instanceSession;
    }

    public set instanceSession(value: InstanceSession) {
        this._instanceSession = value;
    }

    public get sessionId(): string {
        return this._sessionId;
    }

    public set sessionId(value: string) {
        this._sessionId = value;
    }

    public get user(): User {
        return this._user;
    }

    public set user(value: User) {
        this._user = value;
    }

    public get role(): string {
        return this._role;
    }

    public set role(value: string) {
        this._role = value;
    }

    public get active(): boolean {
        return this._active;
    }

    public set active(value: boolean) {
        this._active = value;
    }

}
