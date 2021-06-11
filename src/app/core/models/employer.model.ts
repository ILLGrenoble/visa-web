import {JsonObject, JsonProperty} from 'json2typescript';

@JsonObject('Employer')
export class Employer {

    @JsonProperty('id', Number)
    public id: number = undefined;

    @JsonProperty('name', String)
    public name: string = undefined;

    @JsonProperty('town', String)
    public town: string = undefined;

    @JsonProperty('countryCode', String)
    public countryCode: string = undefined;

}
