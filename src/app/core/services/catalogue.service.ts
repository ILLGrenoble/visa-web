import {HttpClient, HttpParams} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {environment} from 'environments/environment';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {ImagePlans, Plan} from '../models';
import {ObjectMapperService} from './object-mapper.service';

@Injectable()
export class CatalogueService {
    constructor(private http: HttpClient,
                private objectMapper: ObjectMapperService) {
    }

    public getPlansForExperiments(experiments: string[]): Observable<Plan[]> {
        const baseUrl = environment.paths.api;
        if (experiments == null || experiments.length === 0) {
            return this.getPlans();
        } else {
            const params = {
                params: new HttpParams().set('experiments', experiments.join(',')),
            };
            const url = `${baseUrl}/plans`;
            return this.http.get<any>(url, params).pipe(map((response) => {
                const plans = response.data;
                return plans.map((plan) => this.objectMapper.deserialize(plan, Plan));
            }));
        }
    }

    public getPlans(): Observable<Plan[]> {
        const baseUrl = environment.paths.api;
        const url = `${baseUrl}/plans`;
        return this.http.get<any>(url).pipe(map((response) => {
            const plans = response.data;
            return plans.map((plan) => this.objectMapper.deserialize(plan, Plan));
        }));
    }

    public convertPlansToImagePlans(plans: Plan[]): ImagePlans[] {
        const allImagePlans = new Array<ImagePlans>();
        if (plans != null) {
            plans.forEach((plan) => {
                let imagePlans = allImagePlans.find((anImagePlans) => anImagePlans.image.id === plan.image.id);
                if (imagePlans == null) {
                    imagePlans = new ImagePlans(plan.image);
                    allImagePlans.push(imagePlans);
                }
                imagePlans.addPlan(plan);
            });
        }

        return allImagePlans;
    }

}
