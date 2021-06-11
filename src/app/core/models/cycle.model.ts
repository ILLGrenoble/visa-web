import {JsonObject, JsonProperty} from 'json2typescript';

@JsonObject('Cycle')
export class Cycle {
    @JsonProperty('id', Number)
    public id: number = undefined;

    @JsonProperty('name', String)
    public name: string = undefined;

    @JsonProperty('startDate', String)
    public startDate: string = undefined;

    @JsonProperty('endDate', String)
    public endDate: string = undefined;
}
