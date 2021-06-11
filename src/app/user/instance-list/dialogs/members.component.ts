import {Component, Inject, Input, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {AccountService, Instance, Member, User} from '@core';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

@Component({
    selector: 'visa-instance-list-members-dialog',
    templateUrl: 'members.component.html',
    styleUrls: ['./members.component.scss'],
})
// tslint:disable-next-line:component-class-suffix
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
                private snackBar: MatSnackBar,
                private dialogRef: MatDialogRef<MembersDialog>,
                @Inject(MAT_DIALOG_DATA)
                private data: { instance: Instance }) {
        this.instance = data.instance;
    }

    public ngOnInit(): void {
        this.bindDialogHandlers();
        this.loadUsers();
        this.loadScientificSupportUsers();
        this.loadMembers();
    }

    /**
     * Add a new member to the instance
     */
    public handleAdd($event): void {
        const member = Member.create(this.selectedUser, this.selectedRole.id);
        if (this.isMember(this.selectedUser)) {
            this.createSnackbar('User selected is already a member of this instance');
        } else {
            this.accountService.createMemberForInstance(this.instance, member).subscribe((_) => {
                this.loadMembers();
                this.createSnackbar('Successfully added member');
                this.selectedUser = null;
            });
        }
    }

    /**
     * Add a new member to the instance
     */
    public handleAddSupport($event): void {
        const member = Member.create(this.selectedSupportUser, this.selectedSupportRole.id);
        if (this.isMember(this.selectedSupportUser)) {
            this.createSnackbar('User selected is already a member of this instance');
        } else {
            this.accountService.createMemberForInstance(this.instance, member).subscribe((_) => {
                this.loadMembers();
                this.createSnackbar('Successfully added member');
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
            this.accountService.deleteMemberFromInstance(this.instance, member).subscribe((_) => {
                this.loadMembers();
                this.createSnackbar('Deleted member');
            });
        }
    }

    /**
     * Update the members role
     */
    public handleRoleChange($event, member): void {
        this.accountService.updateMemberForInstance(this.instance, member).subscribe((result) => {
                this.createSnackbar('Successfully updated members role');
                this.loadMembers();
            },
            (error) => {
                this.loadMembers();
            });
    }

    private bindDialogHandlers(): void {
        this.dialogRef.backdropClick().subscribe(() => {
            this.handleClose();
        });

        this.dialogRef.keydownEvents().subscribe((event) => {
            if (event.key === 'Escape') {
                this.handleClose();
            }
        });
    }

    private isMember(user: User): Member {
        return this.members.find((member) => member.user.id === user.id);
    }

    private createSnackbar(text: string): void {
        this.snackBar.open(text, 'OK', {
            duration: 2000,
        });
    }

    private loadUsers(): void {
        this.$users = this.accountService.getExperimentalTeamForInstance(this.instance).pipe(map((data) => {
            return data.data.map(this.toOption);
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

}
