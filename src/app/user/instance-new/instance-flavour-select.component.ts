import {Component, Input, Output, ViewEncapsulation} from '@angular/core';
import {CustomFlavour, Flavour, ImagePlans, Plan} from '@core';
import {BehaviorSubject} from 'rxjs';

@Component({
    selector: 'visa-instance-flavour-select',
    templateUrl: './instance-flavour-select.component.html',
    styleUrls: ['./instance-flavour-select.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class InstanceFlavourSelectComponent {

    private _flavourConfigs: CustomFlavour[] = null;

    @Output()
    public selectedCustomFlavour: BehaviorSubject<CustomFlavour> = new BehaviorSubject<CustomFlavour>(null);

    @Input()
    set imagePlans(imagePlans: ImagePlans) {
        let selectedFlavourConfig = null;
        this._flavourConfigs = [];
        if (imagePlans) {
            this._flavourConfigs = imagePlans.plans.map(plan => {
                return {flavour: plan.flavour, plan, ...this.convertDuration(plan.flavour.lifetimeMinutes)};
            });

            selectedFlavourConfig = this._flavourConfigs.find(config => config.plan.preset);
            if (!selectedFlavourConfig && this._flavourConfigs.length === 1) {
                selectedFlavourConfig = this._flavourConfigs[0];
            }
        }

        this.setSelectedFlavourConfig(selectedFlavourConfig);
    }

    get customFlavours(): CustomFlavour[] {
        return this._flavourConfigs;
    }

    constructor() {
    }

    public setSelectedFlavourConfig(selectedCustomFlavour: CustomFlavour) {
        this.selectedCustomFlavour.next(selectedCustomFlavour);
    }

    public getCpuView(flavour: Flavour): string {
        return flavour.cpu + ' Core' + (flavour.cpu !== 1 ? 's' : '');
    }

    public getRamView(flavour: Flavour): string {
        return (Math.round(flavour.memory / 1024 * 10) / 10) + 'GB';
    }

    private convertDuration(minutes: number): {lifetimeUnit: string; lifetimeValue: number; lifetimeMaxValue: number; lifetimeMinutesMultiplier: number;} {
        if (minutes == null || isNaN(minutes)) return null;

        const days = Math.floor(minutes / 1440);
        const hours = Math.floor((minutes % 1440) / 60);
        const mins = minutes % 60;

        if (mins != 0) {
            return {lifetimeUnit: 'minute', lifetimeValue: minutes, lifetimeMaxValue: minutes, lifetimeMinutesMultiplier: 1};
        } else if (hours != 0) {
            const hoursTotal = hours + days * 24
            return {lifetimeUnit: 'hour', lifetimeValue: hoursTotal, lifetimeMaxValue: hoursTotal, lifetimeMinutesMultiplier: 60};
        } else {
            return {lifetimeUnit: 'day', lifetimeValue: days, lifetimeMaxValue: days, lifetimeMinutesMultiplier: 1440};
        }
    }
}
