import {Component, Input, Output} from '@angular/core';
import {CatalogueService, ImagePlans, Plan} from '@core';
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
        let selectedPlan = null;
        if (imagePlans) {
            selectedPlan = imagePlans.plans.find(plan => plan.preset);
            if (!selectedPlan && imagePlans.plans.length === 1) {
                selectedPlan = imagePlans.plans[0];
            }
        }

        this.selectedPlan.next(selectedPlan);
        this._imagePlans = imagePlans;
    }

    get imagePlans(): ImagePlans {
        return this._imagePlans;
    }

    private _imagePlans: ImagePlans = null;

    constructor(private _catalogueService: CatalogueService) {
    }

    public getCpuView(flavour): string {
        return flavour.cpu + ' Core' + (flavour.cpu !== 1 ? 's' : '');
    }

    public getRamView(flavour): string {
        return (Math.round(flavour.memory / 1024 * 10) / 10) + 'GB';
    }
}
