import {Pipe, PipeTransform} from '@angular/core';

import {RoleLifetime} from "../../../core/graphql";
import {formatDuration} from "../utils";

@Pipe({name: 'roleLifetime'})
export class RoleLifetimePipe implements PipeTransform {
    public transform(roleLifetime: RoleLifetime): string {
        if (roleLifetime == null) {
            return '';
        }

        const roleName = roleLifetime.role ? roleLifetime.role.name : 'Default';
        const duration = formatDuration(roleLifetime.lifetimeMinutes);
        return `${roleName} : ${duration}`;
    }
}
