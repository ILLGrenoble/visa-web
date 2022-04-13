import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {User, UserInput} from '../../../core/graphql';
import {FormControl, FormGroup} from '@angular/forms';
import {Subject} from 'rxjs';
import * as moment from 'moment';

@Component({
    selector: 'visa-admin-user-edit',
    templateUrl: './user-edit.component.html',
})
export class UserEditComponent implements OnInit {

    private _onSubmit$: Subject<UserInput> = new Subject<UserInput>();

    private _form: FormGroup;

    private _minDate: string;

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

    constructor(private _dialogRef: MatDialogRef<UserEditComponent>,
                @Inject(MAT_DIALOG_DATA) private _user) {

        const now = new Date();
        this._minDate = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    }

    private _createForm(): FormGroup {
        const {instanceQuota, userRoles} = this._user;
        const admin = userRoles.find(userRole => userRole.role.name === 'ADMIN') != null;
        const guestRole = userRoles.find(userRole => userRole.role.name === 'GUEST');
        const guest = guestRole != null;
        const guestRoleExpiresAtDate = guestRole != null && guestRole.expiresAt != null ? new Date(guestRole.expiresAt) : null;

        const guestRoleExpiresAt = guestRoleExpiresAtDate == null ? null : `${guestRoleExpiresAtDate.getDate()}/${guestRoleExpiresAtDate.getMonth() + 1}/${guestRoleExpiresAtDate.getFullYear()}`;

        return new FormGroup({
            instanceQuota: new FormControl(instanceQuota),
            admin: new FormControl(admin),
            guest: new FormControl(guest),
            guestExpiresAt:  new FormControl(guestRoleExpiresAt),
        });
    }

    public ngOnInit(): void {
        this._form = this._createForm();

    }

    public onCancel(): void {
        this._dialogRef.close();
    }

    public submit(): void {

        const {instanceQuota, admin, guest, guestExpiresAt} = this._form.value;

        let guestExpiresAtDate = null;
        if (guest && guestExpiresAt != null && guestExpiresAt !== '') {
            const guestExpiresAtComponents = guestExpiresAt.split('/');
            guestExpiresAtDate = `${guestExpiresAtComponents[2]}-${guestExpiresAtComponents[1]}-${guestExpiresAtComponents[0]} 09:00`;
        }
        const input = {
            instanceQuota,
            admin,
            guest,
            guestExpiresAt: guestExpiresAtDate
        } as UserInput;
        this._onSubmit$.next(input);
        this._dialogRef.close();
    }

}
