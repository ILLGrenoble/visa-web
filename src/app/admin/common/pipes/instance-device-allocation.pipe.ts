import {Pipe, PipeTransform} from '@angular/core';

import {InstanceDeviceAllocation} from "../../../core/graphql";

@Pipe({name: 'instanceDeviceAllocation'})
export class InstanceDeviceAllocationPipe implements PipeTransform {
    public transform(instanceDeviceAllocation: InstanceDeviceAllocation): string {
        if (instanceDeviceAllocation == null) {
            return '';
        }

        const name = instanceDeviceAllocation.devicePool.name;
        if (instanceDeviceAllocation.unitCount > 1) {
            return `${name} x ${instanceDeviceAllocation.unitCount}`;
        } else {
            return name;
        }
    }
}
