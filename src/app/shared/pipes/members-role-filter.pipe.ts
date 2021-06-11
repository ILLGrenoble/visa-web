import {Pipe, PipeTransform} from '@angular/core';
import {Member} from '@core';

@Pipe({
    name: 'membersRoleFilter',
})
export class MembersRoleFilterPipe implements PipeTransform {
    public transform(members: Member[], role: string): any {
        return members.filter((member) => member.role === role);
    }
}
