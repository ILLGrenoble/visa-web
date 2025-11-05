import {Plan} from './plan.model';
import {Flavour} from "./flavour.model";

export class CustomFlavour {
    flavour: Flavour;
    plan: Plan;
    lifetimeUnit: string;
    lifetimeValue: number;
    lifetimeMaxValue: number;
    lifetimeMinutesMultiplier: number;

    constructor(config: Partial<CustomFlavour>) {
        Object.assign(this, config);
    }
}
