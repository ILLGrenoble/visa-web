import {Component, Input, Output} from '@angular/core';
import {CatalogueService, ImagePlans, Plan} from '@core';
import {BehaviorSubject} from 'rxjs';

@Component({
    selector: 'visa-instance-image-select',
    templateUrl: './instance-image-select.component.html',
    styleUrls: ['./instance-image-select.component.scss'],
})
export class InstanceImageSelectComponent {

    @Output()
    public selected: BehaviorSubject<ImagePlans> = new BehaviorSubject<ImagePlans>(null);

    @Input()
    set plans(plans: Plan[]) {
        this._imagePlansArray = null;
        this.selected.next(null);
        this.updateImages(plans);
    }

    private _imagePlansArray: ImagePlans[] = null;

    get imagePlansArray(): ImagePlans[] {
        return this._imagePlansArray;
    }

    constructor(private _catalogueService: CatalogueService) {
    }

    private updateImages(plans: Plan[]): void {
        this._imagePlansArray = this._catalogueService.convertPlansToImagePlans(plans);

        // Get the preset plan/image
        const presetImagePlans = this._imagePlansArray.find(imagePlans => imagePlans.plans.find(plan => plan.preset));
        if (presetImagePlans) {
            this.selected.next(presetImagePlans);

        } else if (this._imagePlansArray.length === 1) {
            this.selected.next(this._imagePlansArray[0]);
        }
    }

}
