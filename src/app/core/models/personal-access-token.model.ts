import {JsonObject, JsonProperty} from 'json2typescript';

@JsonObject('PersonalAccessToken')
export class PersonalAccessToken {
    @JsonProperty('id', Number)
    public id: number = undefined;

    @JsonProperty('name', String)
    public name: string = undefined;

    @JsonProperty('instanceId', Number)
    public instanceId: number = undefined;

    @JsonProperty('instanceUid', String)
    public instanceUid: string = undefined;

    @JsonProperty('role', String)
    public role: string = undefined

    @JsonProperty('token', String)
    public token: string = undefined;

    @JsonProperty('createdAt', String)
    public createdAt: string = undefined;
}
