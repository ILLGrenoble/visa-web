import {JsonObject, JsonProperty} from 'json2typescript';

@JsonObject('Quota')
export class Quota  {

    @JsonProperty('maxInstances', Number)
    public maxInstances: number = undefined;

    @JsonProperty('totalInstances', Number)
    public totalInstances: number = undefined;

    @JsonProperty('availableInstances', Number)
    public availableInstances: number = undefined;
}
