import {JsonObject, JsonProperty} from 'json2typescript';

@JsonObject('Instrument')
export class Instrument {
    @JsonProperty('id', Number)
    public id: number = undefined;

    @JsonProperty('name', String)
    public name: string = undefined;
}
