import {Pipe, PipeTransform} from '@angular/core';

import {FlavourDevice} from "../../../core/graphql";

@Pipe({name: 'flavourDevice'})
export class FlavourDevicePipe implements PipeTransform {
    public transform(flavourDevice: FlavourDevice): string {
        if (flavourDevice == null) {
            return '';
        }

        const name = flavourDevice.devicePool.name;
        if (flavourDevice.unitCount > 1) {
            return `${name} x ${flavourDevice.unitCount}`;
        } else {
            return name;
        }
    }
}
