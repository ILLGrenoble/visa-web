import {JsonObject, JsonProperty} from 'json2typescript';
import {Employer} from './employer.model';
import {Role} from './role.model';

@JsonObject('User')
export class User {

    @JsonProperty('id', String)
    public id: string = undefined;

    @JsonProperty('firstName', String)
    public firstName: string = undefined;

    @JsonProperty('lastName', String)
    public lastName: string = undefined;

    @JsonProperty('fullName', String)
    public fullName: string = undefined;

    @JsonProperty('affiliation', Employer)
    public affiliation: Employer = undefined;

    @JsonProperty('instanceQuotaLimit', Number, true)
    public instanceQuotaLimit: number = undefined;

    @JsonProperty('email', String, true)
    public email: string = undefined;

    @JsonProperty('activeUserRoles', [Role], true)
    private activeUserRoles: Role[] = undefined;

    get admin(): boolean {
        return this.hasRole('ADMIN');
    }

    get support(): boolean {
        return this.hasAnyRole(['IT_SUPPORT', 'INSTRUMENT_CONTROL', 'INSTRUMENT_SCIENTIST', 'SCIENTIFIC_SUPPORT']);
    }

    get roles(): string[] {
        const now = Date.now();
        return this.activeUserRoles.filter(role => role.expiresAt == null || role.expiresAt.getTime() > now).map(role => role.name);
    }

    get humanReadableSupportRole(): string {
        if (this.hasRole('INSTRUMENT_SCIENTIST')) {
            return 'Scientific Support';

        } else if (this.hasRole('INSTRUMENT_CONTROL')) {
            return 'Instrument Control Support';

        } else if (this.hasRole('SCIENTIFIC_COMPUTING')) {
            return 'Scientific Computing Support';

        } else if (this.hasRole('IT_SUPPORT')) {
            return 'IT Support';
        }
        return null;
    }

    constructor() {

    }

    public hasRole(role: string): boolean {
        return this.roles.includes(role);
    }

    public hasAnyRole(roles: string[]): boolean {
        for (const role of roles) {
            if (this.hasRole(role)) {
                return true;
            }
        }
        return false;
    }

    public hasOnlyRole(role: string): boolean {
        return this.roles.length === 1 && this.roles[0] === role;
    }

    public getUserRole(roleName: string): Role {
        return this.activeUserRoles.find(role => role.name === roleName);
    }
}
