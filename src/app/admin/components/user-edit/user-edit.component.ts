import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Role, User, UserInput} from '../../../core/graphql';
import {FormControl, FormGroup} from '@angular/forms';
import {Subject} from 'rxjs';
import gql from 'graphql-tag';
import {map, takeUntil} from 'rxjs/operators';
import {Apollo} from 'apollo-angular';

@Component({
    selector: 'visa-admin-user-edit',
    templateUrl: './user-edit.component.html',
})
export class UserEditComponent implements OnInit, OnDestroy {

    private _onSubmit$: Subject<UserInput> = new Subject<UserInput>();
    private _destroy$: Subject<boolean> = new Subject<boolean>();

    private _form: FormGroup;

    private readonly _minDate: string;
    private _userGroups: Role[];


    get user(): User {
        return this._user;
    }

    public get form(): FormGroup {
        return this._form;
    }

    public set form(value: FormGroup) {
        this._form = value;
    }

    get onSubmit$(): Subject<UserInput> {
        return this._onSubmit$;
    }

    get showGuestExpiryDate(): boolean {
        return this._form.value.guest === true;
    }

    get minDate(): string {
        return this._minDate;
    }

    get userGroups(): Role[] {
        return this._userGroups;
    }

    constructor(private _dialogRef: MatDialogRef<UserEditComponent>,
                private _apollo: Apollo,
                @Inject(MAT_DIALOG_DATA) private _user) {

        const now = new Date();
        this._minDate = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    }

    private _createForm(): FormGroup {
        const {instanceQuota, activeUserRoles, groups} = this._user;
        const admin = activeUserRoles.find(userRole => userRole.role.name === 'ADMIN') != null;
        const guestRole = activeUserRoles.find(userRole => userRole.role.name === 'GUEST');
        const guest = guestRole != null;
        const guestRoleExpiresAtDate = guestRole != null && guestRole.expiresAt != null ? new Date(guestRole.expiresAt) : null;

        const guestRoleExpiresAt = guestRoleExpiresAtDate == null ? null : `${guestRoleExpiresAtDate.getDate()}/${guestRoleExpiresAtDate.getMonth() + 1}/${guestRoleExpiresAtDate.getFullYear()}`;

        return new FormGroup({
            instanceQuota: new FormControl(instanceQuota),
            admin: new FormControl(admin),
            guest: new FormControl(guest),
            guestExpiresAt:  new FormControl(guestRoleExpiresAt),
            userGroups: new FormControl(groups),
        });
    }

    public ngOnInit(): void {
        this._form = this._createForm();
        this._apollo.query<any>({
            query: gql`
               query groups {
                     groups {
                        id
                        name
                    }
                }
            `
        }).pipe(
            map(({data}) => ({userGroups: data.groups})),
            takeUntil(this._destroy$),
        ).subscribe(({userGroups}) => {
            this._userGroups = userGroups || [];
        });
    }

    ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    public onCancel(): void {
        this._dialogRef.close();
    }

    public submit(): void {

        const {instanceQuota, admin, guest, guestExpiresAt, userGroups} = this._form.value;

        let guestExpiresAtDate = null;
        if (guest && guestExpiresAt != null && guestExpiresAt !== '') {
            const guestExpiresAtComponents = guestExpiresAt.split('/');
            guestExpiresAtDate = `${guestExpiresAtComponents[2]}-${guestExpiresAtComponents[1]}-${guestExpiresAtComponents[0]} 09:00`;
        }
        const input = {
            instanceQuota,
            admin,
            guest,
            guestExpiresAt: guestExpiresAtDate,
            groupIds: userGroups ? userGroups.map(role => role.id) : [],
        } as UserInput;
        this._onSubmit$.next(input);
        this._dialogRef.close();
    }

}
