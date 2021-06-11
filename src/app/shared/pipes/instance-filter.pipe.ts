import {Pipe, PipeTransform} from '@angular/core';
import {Experiment, Instance} from '@core';

@Pipe({
    name: 'instanceFilterPipe',
})
export class InstanceFilterPipe implements PipeTransform {

    public transform(instances: Instance[], roles: string[], experiment: Experiment): any {
        return instances
            .filter(instance => this.isMember(instance, roles))
            .filter(instance => this.isExperiment(instance, experiment));
    }

    private isMember(instance: Instance, roles: string[]): boolean {
        if (instance.membership == null) {
            return false;
        }
        return roles.includes(instance.membership.role);
    }

    private isExperiment(instance: Instance, experiment: Experiment): boolean {
        if (experiment == null) {
            return true;
        }
        return instance.experiments.find(that => that.id === experiment.id) != null;
    }
}
