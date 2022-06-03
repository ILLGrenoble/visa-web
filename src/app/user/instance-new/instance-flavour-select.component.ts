import {ChangeDetectionStrategy, Component, Input, OnInit, Output} from '@angular/core';
import {CatalogueService, ImagePlans, Plan, Quota} from '@core';
import {BehaviorSubject} from 'rxjs';

@Component({
    selector: 'visa-instance-flavour-select',
    templateUrl: './instance-flavour-select.component.html',
    styleUrls: ['./instance-flavour-select.component.scss'],
})
export class InstanceFlavourSelectComponent {

    @Output()
    public selectedPlan: BehaviorSubject<Plan> = new BehaviorSubject<Plan>(null);

    @Input()
    set imagePlans(imagePlans: ImagePlans) {
        this._imagePlans = imagePlans;
        this._updateSelectedPlan();
    }

    get imagePlans(): ImagePlans {
        return this._imagePlans;
    }

    @Input()
    set quotas(quota: Quota) {
        this._quota = quota;
        this._updateSelectedPlan();
    }

    get quota(): Quota {
        return this._quota;
    }

    private _imagePlans: ImagePlans = null;
    private _quota: Quota;

    constructor(private _catalogueService: CatalogueService) {
    }

    public getCpuView(flavour): string {
        return flavour.cpu + ' Core' + (flavour.cpu !== 1 ? 's' : '');
    }

    public getRamView(flavour): string {
        return (Math.round(flavour.memory / 1024 * 10) / 10) + 'GB';
    }

    public getCreditsView(credits): string {
        return credits + ' Credit' + (credits !== 1 ? 's' : '');
    }

    public onPlanSelected(selectedPlan: Plan): void {
        if (selectedPlan.flavour.credits <= this._quota.creditsAvailable) {
            this.selectedPlan.next(selectedPlan);
        }
    }

    private _updateSelectedPlan(): void {
        let selectedPlan = null;
        if (this._imagePlans && this._quota) {
            selectedPlan = this._imagePlans.plans.find(plan => plan.preset);
            if (selectedPlan && selectedPlan.flavour.credits > this._quota.creditsAvailable) {
                selectedPlan = null;
            }
        }
        this.selectedPlan.next(selectedPlan);
    }
}
