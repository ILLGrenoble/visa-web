import {JsonObject, JsonProperty} from 'json2typescript';
import {User} from './user.model';

@JsonObject('Member')
export class Member {
    @JsonProperty('id', Number, true)
    private _id: number = undefined;

    @JsonProperty('role', String)
    private _role: string = undefined;

    @JsonProperty('user', User)
    private _user: User = undefined;

    public static create(user: any, role: string): Member {
        const member = new Member();
        member.user = user;
        member.role = role;
        return member;
    }

    public get role(): string {
        return this._role;
    }

    public set role(value: string) {
        this._role = value;
    }

    public get user(): User {
        return this._user;
    }

    public set user(value: User) {
        this._user = value;
    }

    public get id(): number {
        return this._id;
    }

    public set id(value: number) {
        this._id = value;
    }

    public getHumanizedRole(): string {
        switch (this._role) {
            case 'OWNER':
                return 'Owner';
            case 'USER':
                return 'User';
            case 'GUEST':
                return 'Guest';
        }
    }

    public isRole(...roles: string[]): boolean {
        return roles.indexOf(this._role) >= 0;
    }

}
