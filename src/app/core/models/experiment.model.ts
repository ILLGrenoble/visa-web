import {JsonObject, JsonProperty} from 'json2typescript';
import {Cycle} from './cycle.model';
import {Instrument} from './instrument.model';
import {Proposal} from './proposal.model';

@JsonObject('Experiment')
export class Experiment {
    @JsonProperty('id', String)
    public id: string = undefined;

    @JsonProperty('cycle', Cycle)
    public cycle: Cycle = undefined;

    @JsonProperty('instrument', Instrument)
    public instrument: Instrument = undefined;

    @JsonProperty('proposal', Proposal)
    public proposal: Proposal = undefined;

    @JsonProperty('startDate', String)
    public startDate: string = undefined;

    @JsonProperty('endDate', String)
    public endDate: string = undefined;

}
