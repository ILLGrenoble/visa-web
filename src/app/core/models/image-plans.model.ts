import {Image} from './image.model';
import {Plan} from './plan.model';

export class ImagePlans {
    public image: Image;
    public plans: Plan[] = [];

    constructor(image: Image) {
        this.image = image;
    }

    public addPlan(plan: Plan): void {
        this.plans.push(plan);
    }
}
