import {Pipe, PipeTransform} from '@angular/core';

import {CloudDeviceAllocation} from "../../../core/graphql";

@Pipe({name: 'cloudDeviceAllocation'})
export class CloudDeviceAllocationPipe implements PipeTransform {
    public transform(cloudDeviceAllocation: CloudDeviceAllocation): string {
        if (cloudDeviceAllocation == null) {
            return '';
        }

        const name = cloudDeviceAllocation.device.identifier;
        if (cloudDeviceAllocation.unitCount > 1) {
            return `${name} x ${cloudDeviceAllocation.unitCount}`;
        } else {
            return name;
        }
    }
}
