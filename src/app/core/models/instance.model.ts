import {JsonConverter, JsonCustomConvert, JsonObject, JsonProperty} from 'json2typescript';
import {Experiment} from './experiment.model';
import {Member} from './member.model';
import {Plan} from './plan.model';
import {User} from './user.model';
import {Protocol} from './protocol.model';
import {state} from "@angular/animations";

@JsonConverter
class DateConverter implements JsonCustomConvert<Date> {
    public serialize(date: Date): any {
        return  date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
    }

    public deserialize(date: any): Date {
        return date == null ? null : new Date(date);
    }
}

@JsonObject('Instance')
export class Instance {

    @JsonProperty('id', Number, true)
    private _id: number = undefined;

    @JsonProperty('uid', String)
    private _uid: string = undefined;

    @JsonProperty('computeId', String)
    private _computeId: string = undefined;

    @JsonProperty('name', String)
    private _name: string = undefined;

    @JsonProperty('ipAddress', String)
    private _ipAddress: string = undefined;

    @JsonProperty('comments', String)
    private _comments: string = undefined;

    @JsonProperty('createdAt', String)
    private _createdAt: string = undefined;

    @JsonProperty('plan', Plan)
    private _plan: Plan = undefined;

    @JsonProperty('state', String)
    private _state: string = undefined;

    @JsonProperty('lastInteractionAt', DateConverter)
    private _lastInteractionAt: Date = undefined;

    @JsonProperty('lastSeenAt', DateConverter)
    private _lastSeenAt: Date = undefined;

    @JsonProperty('expirationDate', DateConverter)
    private _expirationDate: Date = undefined;

    @JsonProperty('terminationDate', DateConverter)
    private _terminationDate: Date = undefined;

    @JsonProperty('screenHeight', Number, true)
    private _screenHeight: number = undefined;

    @JsonProperty('membership', Member)
    private _membership?: Member = undefined;

    @JsonProperty('experiments', [Experiment])
    private _experiments: Experiment[] = [];

    @JsonProperty('members', [Member])
    private _members: Member[] = undefined;

    @JsonProperty('screenWidth', Number, true)
    private _screenWidth: number = undefined;

    @JsonProperty('canConnectWhileOwnerAway', Boolean, true)
    private _canConnectWhileOwnerAway: boolean = undefined;

    @JsonProperty('unrestrictedAccess', Boolean, true)
    private _unrestrictedAccess: boolean = undefined;

    @JsonProperty('deleteRequested', Boolean, true)
    private _deleteRequested: boolean = undefined;

    @JsonProperty('keyboardLayout', String)
    private _keyboardLayout: string = undefined;

    @JsonProperty('activeProtocols', [String])
    private _activeProtocols: string[] = undefined;

    @JsonProperty('vdiProtocol', Protocol)
    private _vdiProtocol: Protocol = undefined;

    @JsonProperty('publicAccessToken', String)
    private _publicAccessToken: string = undefined;

    @JsonProperty('publicAccessRole', String)
    private _publicAccessRole: string = undefined;

    public get id(): number {
        return this._id;
    }

    public set id(value: number) {
        this._id = value;
    }

    public get uid(): string {
        return this._uid;
    }

    public set uid(value: string) {
        this._uid = value;
    }

    get computeId(): string {
        return this._computeId;
    }

    set computeId(value: string) {
        this._computeId = value;
    }

    public get name(): string {
        return this._name;
    }

    public set name(value: string) {
        this._name = value;
    }

    get ipAddress(): string {
        return this._ipAddress;
    }

    set ipAddress(value: string) {
        this._ipAddress = value;
    }

    public get comments(): string {
        return this._comments;
    }

    public set comments(value: string) {
        this._comments = value;
    }

    public get createdAt(): string {
        return this._createdAt;
    }

    public set createdAt(value: string) {
        this._createdAt = value;
    }

    public get plan(): Plan {
        return this._plan;
    }

    public set plan(value: Plan) {
        this._plan = value;
    }

    public get state(): string {
        return this._state;
    }

    public set state(value: string) {
        this._state = value;
    }

    public get lastSeenAt(): Date {
        return this._lastSeenAt;
    }

    public set lastSeenAt(value: Date) {
        this._lastSeenAt = value;
    }

    public get lastInteractionAt(): Date {
        return this._lastInteractionAt;
    }

    public set lastInteractionAt(value: Date) {
        this._lastInteractionAt = value;
    }

    public get expirationDate(): Date {
        return this._expirationDate;
    }

    public set expirationDate(value: Date) {
        this._expirationDate = value;
    }

    public get terminationDate(): Date {
        return this._terminationDate;
    }

    public set terminationDate(value: Date) {
        this._terminationDate = value;
    }

    public get experiments(): Experiment[] {
        return this._experiments;
    }

    public set experiments(value: Experiment[]) {
        this._experiments = value;
    }

    public get members(): Member[] {
        return this._members;
    }

    public set members(value: Member[]) {
        this._members = value;
    }

    public get membership(): Member {
        return this._membership;
    }

    public set membership(value: Member) {
        this._membership = value;
    }

    public get screenWidth(): number {
        return this._screenWidth;
    }

    public set screenWidth(value: number) {
        this._screenWidth = value;
    }

    public get screenHeight(): number {
        return this._screenHeight;
    }

    public set screenHeight(value: number) {
        this._screenHeight = value;
    }

    get canConnectWhileOwnerAway(): boolean {
        return this._canConnectWhileOwnerAway;
    }

    set canConnectWhileOwnerAway(value: boolean) {
        this._canConnectWhileOwnerAway = value;
    }

    get deleteRequested(): boolean {
        return this._deleteRequested;
    }

    set deleteRequested(value: boolean) {
        this._deleteRequested = value;
    }

    get unrestrictedAccess(): boolean {
        return this._unrestrictedAccess;
    }

    set unrestrictedAccess(value: boolean) {
        this._unrestrictedAccess = value;
    }

    public addExperiment(experiment: Experiment): void {
        if (this.experiments.indexOf(experiment) === -1) {
            this.experiments.push(experiment);
        }
    }

    public removeMember(member: Member): void {
        const index = this.members.findIndex((data) => data.user.id === member.user.id);
        this.members.splice(index, 1);
    }

    public removeExperiment(experiment: Experiment): void {
        this.experiments = this.experiments.filter((data) => data !== experiment);
    }

    public get owner(): User {
        const owners = this.members.filter((member) => member.role === 'OWNER');
        if (owners != null && owners.length > 0) {
            return owners[0].user;
        }
        return null;
    }

    public isMember(user: User): Member {
        return this.members.find((member) => member.user.id === user.id);
    }

    public isState(state: string): boolean {
        return this.state === state;
    }

    public willExpireInHours(hours: number): boolean {
        if (this.expirationDate instanceof Date) {
            const durationS = (this.expirationDate.getTime() - new Date().getTime());
            return durationS < hours * 60 * 60 * 1000;
        }
        return false;
    }

    get keyboardLayout(): string {
        return this._keyboardLayout;
    }

    set keyboardLayout(value: string) {
        this._keyboardLayout = value;
    }

    get activeProtocols(): string[] {
        return this._activeProtocols;
    }

    set activeProtocols(value: string[]) {
        this._activeProtocols = value;
    }

    public hasProtocolWithName(protocolName: string): boolean {
        return this._activeProtocols.includes(protocolName);
    }

    get vdiProtocol(): Protocol {
        return this._vdiProtocol;
    }

    set vdiProtocol(value: Protocol) {
        this._vdiProtocol = value;
    }

    get publicAccessToken(): string {
        return this._publicAccessToken;
    }

    set publicAccessToken(value: string) {
        this._publicAccessToken = value;
    }

    get publicAccessRole(): string {
        return this._publicAccessRole;
    }

    set publicAccessRole(value: string) {
        this._publicAccessRole = value;
    }
}
