import {Pipe, PipeTransform} from '@angular/core';
import {Instance} from '@core';

@Pipe({
    name: 'membershipRolefilter',
})
export class MembershipRoleFilterPipe implements PipeTransform {
    public transform(instances: Instance[], roles: [string]): any {
        return instances.filter((instance) => {
            if (instance.membership != null && roles.indexOf(instance.membership.role) >= 0) {
                return true;
            }
            return false;
        });
    }
}
