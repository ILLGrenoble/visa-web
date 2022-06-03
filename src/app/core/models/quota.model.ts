import {JsonObject, JsonProperty} from 'json2typescript';

@JsonObject('Quota')
export class Quota  {

    @JsonProperty('creditsQuota', Number)
    public creditsQuota: number = undefined;

    @JsonProperty('creditsUsed', Number)
    public creditsUsed: number = undefined;

    @JsonProperty('creditsAvailable', Number)
    public creditsAvailable: number = undefined;
}
