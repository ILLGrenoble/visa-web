import {JsonObject, JsonProperty} from 'json2typescript';

@JsonObject('Proposal')
export class Proposal {
    @JsonProperty('id', Number)
    public id: number = undefined;

    @JsonProperty('identifier', String)
    public identifier: string = undefined;

    @JsonProperty('title', String)
    public title: string = undefined;
}
