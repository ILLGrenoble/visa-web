import {JsonObject, JsonProperty} from 'json2typescript';
import {Instrument} from './instrument.model';
import {Proposal} from './proposal.model';

@JsonObject('Experiment')
export class Experiment {
    @JsonProperty('id', String)
    public id: string = undefined;

    @JsonProperty('instrument', Instrument)
    public instrument: Instrument = undefined;

    @JsonProperty('proposal', Proposal)
    public proposal: Proposal = undefined;

    @JsonProperty('title', String, 'isOptional')
    public title: string = undefined;

    @JsonProperty('url', String, 'isOptional')
    public url: string = undefined;

    @JsonProperty('doi', String, 'isOptional')
    public doi: string = undefined;

    @JsonProperty('startDate', String)
    public startDate: string = undefined;

    @JsonProperty('endDate', String)
    public endDate: string = undefined;

}
