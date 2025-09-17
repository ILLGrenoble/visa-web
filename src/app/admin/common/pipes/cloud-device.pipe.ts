import {Pipe, PipeTransform} from '@angular/core';

import {CloudDevice} from "../../../core/graphql";

@Pipe({name: 'cloudDevice'})
export class CloudDevicePipe implements PipeTransform {
    public transform(cloudDevice: CloudDevice): string {
        if (cloudDevice == null) {
            return '';
        }
        const type = cloudDevice.type == 'PASSTHROUGH_GPU' ? 'GPU using PCI Passthrough' : cloudDevice.type == 'VIRTUAL_GPU' ? 'vGPU' : '<unknown>';
        return `${cloudDevice.identifier} (${type})`;
    }
}
