import {Component, Inject, Input, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {AccountService, Instance, Member, User} from '@core';
import {Observable} from 'rxjs';
import {filter, map} from 'rxjs/operators';
import {NotifierService} from 'angular-notifier';

@Component({
    selector: 'visa-instance-list-members-dialog',
    templateUrl: 'members.component.html',
    styleUrls: ['./members.component.scss'],
})
export class MembersDialog implements OnInit {

    @Input()
    public instance: Instance;

    public $users: Observable<[]>;
    public $sciSupportUsers: Observable<{ value: User, label: string }[]>;

    public selectedUser: User;
    public selectedSupportUser: User;

    public members: Member[];

    public roles = [
        {
            id: 'OWNER',
            value: 'Owner',
        },
        {
            id: 'USER',
            value: 'Full control',
        },
        {
            id: 'GUEST',
            value: 'Guest',
        },
    ];
    public selectedRole = this.roles[1];
    public selectedSupportRole = this.roles[1];

    constructor(private accountService: AccountService,
                private notifierService: NotifierService,
                private dialogRef: MatDialogRef<MembersDialog>,
                @Inject(MAT_DIALOG_DATA)
                private data: { instance: Instance }) {
        this.instance = data.instance;
    }

    public ngOnInit(): void {
        this.loadUsers();
        this.loadScientificSupportUsers();
        this.loadMembers();

        this.dialogRef.keydownEvents().pipe(filter(event => event.key === 'Escape')).subscribe(() => this.dialogRef.close());
        this.dialogRef.backdropClick().subscribe(() => this.dialogRef.close());
    }

    /**
     * Add a new member to the instance
     */
    public handleAdd(): void {
        const member = Member.create(this.selectedUser, this.selectedRole.id);
        if (this.isMember(this.selectedUser)) {
            this.showNotification('User selected is already a member of this instance');
        } else {
            this.accountService.createMemberForInstance(this.instance, member).subscribe(() => {
                this.loadMembers();
                this.showNotification('Successfully added member');
                this.selectedUser = null;
            });
        }
    }

    /**
     * Add a new member to the instance
     */
    public handleAddSupport(): void {
        const member = Member.create(this.selectedSupportUser, this.selectedSupportRole.id);
        if (this.isMember(this.selectedSupportUser)) {
            this.showNotification('User selected is already a member of this instance');
        } else {
            this.accountService.createMemberForInstance(this.instance, member).subscribe(() => {
                this.loadMembers();
                this.showNotification('Successfully added member');
                this.selectedSupportUser = null;
            });
        }
    }

    public handleClose(): void {
        this.dialogRef.close();
    }

    public getRoles(member: Member): any {
        if (member.isRole('OWNER') || !this.instance.membership.isRole('OWNER')) {
            return this.roles;
        }
        return this.roles.filter((role) => role.id !== 'OWNER');
    }

    /**
     * Remove the member from the instance
     */
    public handleRemove($event, member): void {
        const confirmation = window.confirm('Are you sure you want to remove this member from your instance?');
        if (confirmation) {
            this.accountService.deleteMemberFromInstance(this.instance, member).subscribe(() => {
                this.loadMembers();
                this.showNotification('Deleted member');
            });
        }
    }

    /**
     * Update the members role
     */
    public handleRoleChange($event, member): void {
        this.accountService.updateMemberForInstance(this.instance, member).subscribe({
            next: () => {
                this.showNotification('Successfully updated members role');
                this.loadMembers();
            },
            error: () => {
                this.loadMembers();
            }
        });
    }

    private isMember(user: User): Member {
        return this.members.find((member) => member.user.id === user.id);
    }

    private showNotification(text: string): void {
        this.notifierService.notify('success', text);
    }

    private loadUsers(): void {
        this.$users = this.accountService.getExperimentalTeamForInstance(this.instance).pipe(map((data) => {
            if (data.data.length > 0) {
                return data.data.map(this.toOption);
            }
        }));
    }

    private loadScientificSupportUsers(): void {
        this.$sciSupportUsers = this.accountService.getScientificSupportUsers().pipe(map((users: User[]) => {
            return users.map(this.toSupportOption);
        }));
    }

    private loadMembers(): void {
        this.accountService.getMembersForInstance(this.instance).subscribe((members) => {
            this.members = members;
        });
    }

    private toOption(user: User): { value: User, label: string } {
        return {
            value: user,
            label: user.affiliation != null ? `${user.fullName} (${user.affiliation.name})` : `${user.fullName}`,
        };
    }

    private toSupportOption(user: User): { value: User, label: string } {
        return {
            value: user,
            label: user.humanReadableSupportRole != null ? `${user.fullName} (${user.humanReadableSupportRole})` : `${user.fullName}`,
        };
    }

    public onUnrestrictedAccessChanged(): void {
        this.accountService.updateInstance(this.instance, {
            name: this.instance.name,
            comments: this.instance.comments,
            screenWidth: this.instance.screenWidth,
            screenHeight: this.instance.screenHeight,
            keyboardLayout: this.instance.keyboardLayout,
            unrestrictedAccess: this.instance.unrestrictedAccess,
        }).subscribe((instance) => {
            this.instance = instance;
            this.showNotification('Member access has been updated');
        });

    }

}
